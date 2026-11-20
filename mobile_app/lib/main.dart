import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/splash_screen.dart';
import 'services/notification_service.dart';
import 'services/supabase_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Pre-load cached appointments & settings from local disk in ~5ms for instant launch
  await SupabaseService.initLocalCache();

  // Initialize Local Notifications & Firebase Messaging
  await NotificationService.initialize();

  // Initialize Supabase Flutter Client
  try {
    await Supabase.initialize(
      url: SupabaseService.supabaseUrl,
      // ignore: deprecated_member_use
      anonKey: SupabaseService.anonKey,
    );
    // Start listening for real-time booking push alerts
    NotificationService.startRealtimeListener();
  } catch (e) {
    debugPrint('Supabase initialization notice: $e');
  }

  runApp(const MyClinicApp());
}

class MyClinicApp extends StatelessWidget {
  const MyClinicApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'عيادتي | My Clinic',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: const Locale('ar', 'EG'),
      supportedLocales: const [
        Locale('ar', 'EG'),
        Locale('ar', ''),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const SplashScreen(),
    );
  }
}
