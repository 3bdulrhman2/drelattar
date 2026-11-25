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
        mgr = AppWidgetManager.getInstance(this)
        root = LinearLayout(this)
        root.orientation = LinearLayout.VERTICAL
        root.gravity = Gravity.TOP
        root.setBackgroundColor(Color.parseColor("#DDDDDD"))
        root.setPadding(24, 120, 24, 24)
        setContentView(root)
        step(0)
    }

    private lateinit var mgr: AppWidgetManager
    private lateinit var root: LinearLayout
    private val classes = listOf(CurrentVisitWidget::class.java, NextBookingWidget::class.java)
    private val ids = IntArray(2)

    private fun step(i: Int, granted: Boolean = false) {
        if (i >= classes.size) return
        if (ids[i] == 0) ids[i] = host.allocateAppWidgetId()
        val comp = ComponentName(this, classes[i])
        val ok = granted || mgr.bindAppWidgetIdIfAllowed(ids[i], comp)
        android.util.Log.i("WidgetProof", classes[i].simpleName + " bind=" + ok)
        if (!ok) {
            val it = android.content.Intent(AppWidgetManager.ACTION_APPWIDGET_BIND)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, ids[i])
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_PROVIDER, comp)
            startActivityForResult(it, i)
            return
        }
        val info = mgr.getAppWidgetInfo(ids[i])
        val v = host.createView(this, ids[i], info)
        v.setAppWidget(ids[i], info)
        val lp = LinearLayout.LayoutParams(resources.displayMetrics.widthPixels - 48, (resources.displayMetrics.density * 110).toInt())
        lp.bottomMargin = 24
        root.addView(v, lp)
        step(i + 1)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        android.util.Log.i("WidgetProof", "bind result " + requestCode + " " + resultCode)
        if (resultCode == RESULT_OK) step(requestCode, true)
    }
    override fun onStart() { super.onStart(); host.startListening() }
    override fun onStop() { super.onStop(); host.stopListening() }
}
