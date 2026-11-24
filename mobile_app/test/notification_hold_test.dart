import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/services/notification_service.dart';

void main() {
  test(
    'notification service remains inert without a platform binding',
    () async {
      expect(NotificationService.isEnabled, true);
      expect(NotificationService.fcmToken, isNull);
      await NotificationService.initialize();
      NotificationService.startRealtimeListener();
      expect(await NotificationService.requestPermission(), false);
      await NotificationService.testNotification();
      await NotificationService.showBookingAlert(
        title: 'synthetic',
        body: 'synthetic',
      );
      NotificationService.stopRealtimeListener();
    },
  );
  test('Firebase setup never auto-registers staff devices', () {
    final pubspec = File('pubspec.yaml').readAsStringSync();
    expect(pubspec.contains('firebase_core:'), true);
    expect(pubspec.contains('firebase_messaging:'), true);
    final manifest = File('android/app/src/main/AndroidManifest.xml')
        .readAsStringSync();
    expect(manifest.contains('firebase_messaging_auto_init_enabled'), true);
    expect(manifest.contains('android:value="false"'), true);
    final gradle = File('android/app/build.gradle.kts').readAsStringSync();
    expect(gradle.contains('id("com.google.gms.google-services")'), false);
  });
}
