package com.sporeward.notification

import android.app.Notification
import android.app.ActivityManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Locale

/** Extend expo-location's notification without replacing its foreground service. */
class RecorderNotificationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("RecorderNotification")
    AsyncFunction("publish") { activity: String, state: String, elapsed: Double, meters: Double, revision: String ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      val manager = context.getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(NotificationChannel(CHANNEL, "Activity recording", NotificationManager.IMPORTANCE_LOW))
      val location = manager.activeNotifications.firstOrNull { it.notification.channelId.endsWith(":sporeward-location") }
      val recording = state == "recording"
      // expo-location owns the recording notification. Never add a second one
      // while its service binds: Android can retain an unwanted grouped summary.
      if (recording && location == null) {
        manager.cancel(FALLBACK_ID)
        return@AsyncFunction false
      }
      val id = if (recording && location != null) location.id else FALLBACK_ID
      val builder = if (recording && location != null) Notification.Builder.recoverBuilder(context, location.notification)
        else Notification.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_menu_mylocation)
      fun action(name: String): PendingIntent {
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)!!
        intent.action = Intent.ACTION_VIEW
        intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        intent.data = Uri.Builder().scheme("sporeward").authority("recorder").appendPath(name)
          .appendQueryParameter("activity", activity).appendQueryParameter("nonce", revision).build()
        return PendingIntent.getActivity(context, name.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      }
      val seconds = (elapsed / 1000).toLong().coerceAtLeast(0)
      val time = String.format(Locale.US, "%d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60)
      builder.setContentTitle(if (recording) "Sporeward is recording" else "Sporeward · paused")
        .setContentText(String.format(Locale.US, "%s · %.2f km%s", time, meters / 1000, if (recording) "" else " · GPS stopped"))
        .setCategory(Notification.CATEGORY_SERVICE).setOngoing(true).setOnlyAlertOnce(true)
        .setContentIntent(action("open")).setActions()
        .addAction(Notification.Action.Builder(null, if (recording) "Pause" else "Resume", action(if (recording) "pause" else "resume")).build())
        .addAction(Notification.Action.Builder(null, "Finish & save", action("finish")).build())
        .setShowWhen(recording).setUsesChronometer(recording).setWhen(System.currentTimeMillis() - elapsed.toLong())
      manager.notify(id, builder.build())
      if (id != FALLBACK_ID) manager.cancel(FALLBACK_ID)
      true
    }
    AsyncFunction("locationServiceRunning") {
      val context = appContext.reactContext
      @Suppress("DEPRECATION")
      context?.getSystemService(ActivityManager::class.java)?.getRunningServices(Int.MAX_VALUE)?.any {
        it.service.className == "expo.modules.location.services.LocationTaskService" && it.foreground
      } ?: false
    }
    AsyncFunction("clear") {
      appContext.reactContext?.getSystemService(NotificationManager::class.java)?.cancel(FALLBACK_ID)
    }
  }
  companion object {
    private const val CHANNEL = "sporeward-recorder"
    private const val FALLBACK_ID = 73001
  }
}
