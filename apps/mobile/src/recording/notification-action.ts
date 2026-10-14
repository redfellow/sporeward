export type NotificationAction = {action:'pause'|'resume'|'finish';activity:string;nonce:string};
/** Require an explicit activity identity so stale controls cannot alter a later outing. */
export function notificationAction(url:string|null):NotificationAction|null {
 if(!url) return null;
 try {
  const u=new URL(url),action=u.pathname.slice(1),activity=u.searchParams.get('activity'),nonce=u.searchParams.get('nonce');
  if(u.protocol!=='sporeward:' || u.hostname!=='recorder' || !['pause','resume','finish'].includes(action) || !activity || !nonce) return null;
  return {action:action as NotificationAction['action'],activity,nonce};
 } catch {return null;}
}

/** One identity per recording section/state, stable across statistic refreshes. */
export function notificationRevision(sections:{id:number;started:number;ended:number|null}[]) {
 const section=sections.at(-1);return section ? `${section.id}:${section.ended ?? section.started}` : '';
}
