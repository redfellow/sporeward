import type { Activity } from './store';

export function recoverySegmentEnd(started: number, lastFix: number | null): number {
 return Math.max(started, lastFix ?? started);
}

type Transition = (status: 'paused' | 'recording', recovery?: boolean) => Promise<void>;

export async function startServiceOrPause(startService: () => Promise<void>, pause: () => Promise<void>): Promise<void> {
 try {
  await startService();
 } catch (error) {
  await pause();
  throw new Error('Recording paused because location service could not be started. Your outing is saved; resume when location is available.',{cause:error});
 }
}

export async function resumeRecording(transition: Transition, startService: () => Promise<void>): Promise<void> {
 await transition('recording');
 await startServiceOrPause(startService,()=>transition('paused'));
}

export interface RecoveryRuntime {
 updateNotification(force?: boolean): Promise<void>;
 current(): Promise<Activity | null>;
 replayGpsSuspended: boolean;
 replayAllowed: boolean;
 now(): number;
 stopService(): Promise<void>;
 backgroundLocationGranted(): Promise<boolean>;
 locationUpdatesRegistered(): Promise<boolean>;
 locationServiceRunning(): Promise<boolean | null>;
 transition(status: 'paused' | 'recording', recovery?: boolean): Promise<void>;
 startService(): Promise<void>;
 pause(): Promise<void>;
 event(message: string): Promise<void>;
 diagnostic(registered: boolean, serviceRunning: boolean | null): Promise<void>;
}

/** Recovery orchestration is separated from native adapters so its persistence and
 * failure outcomes can be checked deterministically without claiming device coverage. */
export async function recoverRecorder(runtime: RecoveryRuntime): Promise<void> {
 await runtime.updateNotification();
 const activity = await runtime.current();
 if (activity?.status !== 'recording') {
  await runtime.stopService();
  await runtime.updateNotification();
  return;
 }
 if (runtime.replayGpsSuspended && runtime.replayAllowed) return;
 if (runtime.now() >= activity.deadline) {
  await runtime.pause();
  await runtime.event('24-hour limit reached. Resume or finish explicitly.');
  return;
 }
 const registered = await runtime.locationUpdatesRegistered();
 const serviceRunning = await runtime.locationServiceRunning();
 if (registered && serviceRunning !== false) return;
 if (!(await runtime.backgroundLocationGranted())) {
  await runtime.transition('paused', true);
  throw new Error('Recording paused: location permission is missing.');
 }
 if (registered) await runtime.stopService();
 await runtime.transition('recording', true);
 await startServiceOrPause(runtime.startService,()=>runtime.transition('paused'));
 await runtime.event('Recording recovered; a new route segment was started.');
 await runtime.diagnostic(registered, serviceRunning);
 await runtime.updateNotification(true);
}
