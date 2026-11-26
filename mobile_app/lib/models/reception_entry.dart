class ReceptionEntry {
  final String id, name, status;
  final DateTime arrivedAt;
  final DateTime? startedAt;
  final String? appointmentId;
  const ReceptionEntry({
    required this.id,
    required this.name,
    required this.status,
    required this.arrivedAt,
    this.startedAt,
    this.appointmentId,
  });
  factory ReceptionEntry.fromJson(Map<String, dynamic> j) => ReceptionEntry(
    id: j['id'],
    name: j['patient_name'],
    status: j['status'],
    arrivedAt: DateTime.parse(j['arrived_at']),
    startedAt: DateTime.tryParse(j['started_at'] ?? ''),
    appointmentId: j['appointment_id'] as String?,
  );
}

class ReceptionSnapshot {
  final DateTime cairoNow;
  final List<ReceptionEntry> entries;
  const ReceptionSnapshot(this.cairoNow, this.entries);
  factory ReceptionSnapshot.fromJson(Map<String, dynamic> j) =>
      ReceptionSnapshot(
        DateTime.parse(j['server_now']),
        (j['entries'] as List)
            .map((r) => ReceptionEntry.fromJson(Map<String, dynamic>.from(r)))
            .toList(),
      );
}
