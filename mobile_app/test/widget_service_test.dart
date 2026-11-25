import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/models/appointment.dart';
import 'package:my_clinic/models/reception_entry.dart';
import 'package:my_clinic/services/widget_service.dart';

Appointment _a(String name, String time, String status, {String date = '2026-11-26'}) =>
    Appointment(
      id: name,
      patientName: name,
      patientPhone: '0100000000',
      appointmentDate: date,
      appointmentTime: time,
      notes: 'private note',
      status: status,
      createdAt: '',
    );

void main() {
  final now = DateTime(2026, 11, 26, 16, 0);
  test('current is the patient in consultation, next sorted upcoming today', () {
    final p = WidgetService.build([
      _a('Ali Hassan Mahmoud', '17:00', 'confirmed'),
      _a('Sara Omar', '16:15', 'pending'),
      _a('Mona Said', '15:00', 'in_consultation'),
      _a('Old Day', '18:00', 'confirmed', date: '2026-11-25'),
      _a('Cancelled One', '16:30', 'cancelled'),
    ], const [], now: now);
    expect(p['day'], '2026-11-26');
    expect((p['current'] as Map)['name'], 'Mona Said');
    final up = p['upcoming'] as List;
    expect(up.map((e) => e['name']).toList(), ['Sara Omar', 'Ali Hassan']);
    expect(up.first['m'], 16 * 60 + 15);
  });

  test('payload holds no phone, note or id', () {
    final p = WidgetService.build([_a('Ali Hassan', '17:00', 'confirmed')], const [], now: now).toString();
    expect(p.contains('0100000000'), isFalse);
    expect(p.contains('private note'), isFalse);
  });

  test('walk-in in consultation counts as current when no booking is', () {
    final w = ReceptionEntry(
      id: '1', name: 'Walk In', status: 'in_consultation',
      arrivedAt: DateTime(2026, 11, 26, 15, 40),
    );
    final p = WidgetService.build(const [], [w], now: now);
    expect((p['current'] as Map)['name'], 'Walk In');
  });
}
