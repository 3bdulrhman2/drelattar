class Appointment {
  final String id;
  final String patientName;
  final String patientPhone;
  final String appointmentDate; // 'YYYY-MM-DD'
  final String appointmentTime; // 'HH:mm'
  final String? notes;
  final String status; // 'pending' | 'confirmed' | 'cancelled' | 'completed'
  final String createdAt;

  Appointment({
    required this.id,
    required this.patientName,
    required this.patientPhone,
    required this.appointmentDate,
    required this.appointmentTime,
    this.notes,
    required this.status,
    required this.createdAt,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id']?.toString() ?? '',
      patientName: json['patient_name']?.toString() ?? json['patientName']?.toString() ?? '',
      patientPhone: json['patient_phone']?.toString() ?? json['patientPhone']?.toString() ?? '',
      appointmentDate: json['appointment_date']?.toString() ?? json['appointmentDate']?.toString() ?? '',
      appointmentTime: json['appointment_time']?.toString() ?? json['appointmentTime']?.toString() ?? '',
      notes: json['notes']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      createdAt: json['created_at']?.toString() ?? json['createdAt']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patient_name': patientName,
      'patient_phone': patientPhone,
      'appointment_date': appointmentDate,
      'appointment_time': appointmentTime,
      'notes': notes,
      'status': status,
      'created_at': createdAt,
    };
  }

  Appointment copyWith({String? status}) {
    return Appointment(
      id: id,
      patientName: patientName,
      patientPhone: patientPhone,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      notes: notes,
      status: status ?? this.status,
      createdAt: createdAt,
    );
  }
}
