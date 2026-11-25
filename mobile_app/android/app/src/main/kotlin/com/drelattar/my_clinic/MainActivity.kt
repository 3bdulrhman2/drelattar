package com.drelattar.my_clinic

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "clinic/widget")
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "update" -> { ClinicWidgetData.save(applicationContext, call.arguments as? String); result.success(true) }
                    "clear" -> { ClinicWidgetData.save(applicationContext, null); result.success(true) }
                    else -> result.notImplemented()
                }
            }
    }
}
