package com.drelattar.my_clinic

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar

/** Home-screen widgets. They only read a small cache written by the app
 *  (first name, time). Nothing is fetched here and no phone/notes are stored. */
object ClinicWidgetData {
    const val PREFS = "clinic_widget"
    const val KEY = "payload"

    fun save(context: Context, json: String?) {
        val e = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        if (json == null) e.remove(KEY) else e.putString(KEY, json)
        e.apply()
        refreshAll(context)
    }

    fun refreshAll(context: Context) {
        val mgr = AppWidgetManager.getInstance(context)
        for (cls in listOf(CurrentVisitWidget::class.java, NextBookingWidget::class.java)) {
            val ids = mgr.getAppWidgetIds(ComponentName(context, cls))
            if (ids.isNotEmpty()) {
                val i = Intent(context, cls).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                context.sendBroadcast(i)
            }
        }
    }

    private fun payload(context: Context): JSONObject? {
        val s = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
            ?: return null
        return try { JSONObject(s) } catch (e: Exception) { null }
    }

    private fun dayKey(): String {
        val c = Calendar.getInstance()
        return String.format("%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
    }

    private fun minutesNow(): Int {
        val c = Calendar.getInstance()
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE)
    }

    /** Returns Pair(title, line) for the current patient. */
    fun current(context: Context): Pair<String, String> {
        val p = payload(context)
        if (p == null || p.optString("day") != dayKey()) return Pair("الحالي", "افتح التطبيق للتحديث")
        val c = p.optJSONObject("current") ?: return Pair("الحالي", "لا يوجد كشف حالي")
        return Pair("الحالي", c.optString("name"))
    }

    fun next(context: Context): Pair<String, String> {
        val p = payload(context)
        if (p == null || p.optString("day") != dayKey()) return Pair("القادم", "افتح التطبيق للتحديث")
        val list = p.optJSONArray("upcoming") ?: return Pair("القادم", "لا يوجد حجز قادم")
        val now = minutesNow()
        for (i in 0 until list.length()) {
            val o = list.getJSONObject(i)
            val m = o.optInt("m", -1)
            if (m >= now - 10) {
                return Pair("القادم", o.optString("name") + " · " + o.optString("t"))
            }
        }
        return Pair("القادم", "لا يوجد حجز قادم اليوم")
    }
}

abstract class ClinicWidgetBase : AppWidgetProvider() {
    abstract fun content(context: Context): Pair<String, String>
    override fun onUpdate(context: Context, mgr: AppWidgetManager, ids: IntArray) {
        val (title, line) = content(context)
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pi = PendingIntent.getActivity(
            context, 0, launch ?: Intent(),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        for (id in ids) {
            val v = RemoteViews(context.packageName, R.layout.clinic_widget)
            v.setTextViewText(R.id.widget_title, title)
            v.setTextViewText(R.id.widget_line, line)
            v.setOnClickPendingIntent(R.id.widget_root, pi)
            mgr.updateAppWidget(id, v)
        }
    }
}

class CurrentVisitWidget : ClinicWidgetBase() {
    override fun content(context: Context) = ClinicWidgetData.current(context)
}

class NextBookingWidget : ClinicWidgetBase() {
    override fun content(context: Context) = ClinicWidgetData.next(context)
}
