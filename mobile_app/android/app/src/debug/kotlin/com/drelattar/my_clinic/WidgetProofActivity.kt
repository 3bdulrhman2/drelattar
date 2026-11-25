package com.drelattar.my_clinic

import android.app.Activity
import android.appwidget.AppWidgetHost
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import java.util.Calendar

/** Debug-only proof harness (not part of release builds): hosts both widgets
 *  with fake demo names so a screenshot shows how they really render. */
class WidgetProofActivity : Activity() {
    private lateinit var host: AppWidgetHost
    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        val c = Calendar.getInstance()
        val day = String.format("%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
        val now = c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE)
        val m = now + 30
        val t = String.format("%02d:%02d", (m / 60) % 24, m % 60)
        val json = "{\"day\":\"$day\",\"current\":{\"name\":\"أحمد محمد\"},\"upcoming\":[{\"name\":\"منى سعيد\",\"t\":\"$t\",\"m\":$m}]}"
        getSharedPreferences(ClinicWidgetData.PREFS, MODE_PRIVATE).edit().putString(ClinicWidgetData.KEY, json).apply()
        host = AppWidgetHost(this, 1)
        val mgr = AppWidgetManager.getInstance(this)
        val root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.TOP
        root.setBackgroundColor(Color.parseColor("#DDDDDD"))
        root.setPadding(24, 120, 24, 24)
        for (cls in listOf(CurrentVisitWidget::class.java, NextBookingWidget::class.java)) {
            val id = host.allocateAppWidgetId()
            val ok = mgr.bindAppWidgetIdIfAllowed(id, ComponentName(this, cls))
            val st = android.widget.TextView(this); st.text = cls.simpleName + " bind=" + ok; root.addView(st)
            android.util.Log.i("WidgetProof", cls.simpleName + " bind=" + ok)
            if (!ok) continue
            val info = mgr.getAppWidgetInfo(id)
            val v = host.createView(this, id, info)
            v.setAppWidget(id, info)
            val lp = LinearLayout.LayoutParams(resources.displayMetrics.widthPixels - 48, (resources.displayMetrics.density * 140).toInt())
            lp.bottomMargin = 24
            root.addView(v, lp)
        }
        setContentView(root)
    }
    override fun onStart() { super.onStart(); host.startListening() }
    override fun onStop() { super.onStop(); host.stopListening() }
}
