import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/models/appointment.dart';
import 'package:my_clinic/widgets/booking_card.dart';
import 'package:my_clinic/theme/app_theme.dart';

void main() {
  for (final status in [
    'pending',
    'confirmed',
    'arrived',
    'in_consultation',
    'completed',
  ]) {
    testWidgets('forward-only booking $status', (t) async {
      String? changed;
      final a = Appointment(
        id: 'synthetic',
        patientName: 'مريض تجريبي',
        patientPhone: '',
        appointmentDate: '2026-11-25',
        appointmentTime: '16:00',
        status: status,
        createdAt: '2026-11-25T10:00:00Z',
      );
      await t.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: Scaffold(
            body: BookingCard(
              appointment: a,
              onStatusChange: (s) => changed = s,
            ),
          ),
        ),
      );
      await t.pumpAndSettle();
      if (status == 'pending') {
        await t.tap(find.text('تأكيد الكشف'));
        expect(changed, 'confirmed');
      } else if (status == 'confirmed') {
        await t.tap(find.text('حضر العيادة'));
        expect(changed, 'arrived');
      } else {
        expect(find.text('تأكيد الكشف'), findsNothing);
        expect(
          find.text('حضر العيادة'),
          status == 'arrived' ? findsOneWidget : findsNothing,
        );
      }
      expect(find.text('إعادة للانتظار'), findsNothing);
    });
  }
}
