import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'clinic_firebase_options.dart';
import 'supabase_service.dart';

/// Runs when a data-only "bookings changed" message arrives while the app is
/// not in the foreground. The message carries no patient data; the app then
/// downloads the bookings with the signed-in staff session and stores them in
/// the local cache so they are already there when the app opens. Android may
/// delay or skip background work (battery saver, vendor limits): best effort.
@pragma('vm:entry-point')
Future<void> clinicBackgroundMessage(RemoteMessage message) async {
  if (message.data['type'] != 'bookings_changed') return;
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(options: clinicAndroidFirebase);
  } catch (_) {}
  try {
    await Supabase.initialize(
      url: SupabaseService.supabaseUrl,
      anonKey: SupabaseService.anonKey,
    );
  } catch (_) {}
  try {
    if (Supabase.instance.client.auth.currentSession == null) return;
    await SupabaseService.refreshAppointmentsFromServer();
  } catch (_) {}
}
