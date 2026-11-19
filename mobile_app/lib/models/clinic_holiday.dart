class ClinicHoliday {
  final String id;
  final String title;
  final String startDate; // 'YYYY-MM-DD'
  final String endDate;   // 'YYYY-MM-DD'
  final String? reason;
  final String? customMessage;
  final bool isActive;
  final String createdBy;
  final String createdAt;

  ClinicHoliday({
    required this.id,
    required this.title,
    required this.startDate,
    required this.endDate,
    this.reason,
    this.customMessage,
    this.isActive = true,
    this.createdBy = 'admin',
    required this.createdAt,
  });

  factory ClinicHoliday.fromJson(Map<String, dynamic> json) {
    return ClinicHoliday(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      startDate: json['startDate']?.toString() ?? json['start_date']?.toString() ?? '',
      endDate: json['endDate']?.toString() ?? json['end_date']?.toString() ?? '',
      reason: json['reason']?.toString(),
      customMessage: json['customMessage']?.toString() ?? json['custom_message']?.toString(),
      isActive: json['isActive'] == true || json['is_active'] == true,
      createdBy: json['createdBy']?.toString() ?? json['created_by']?.toString() ?? 'admin',
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'startDate': startDate,
      'endDate': endDate,
      'reason': reason,
      'customMessage': customMessage,
      'isActive': isActive,
      'createdBy': createdBy,
      'createdAt': createdAt,
    };
  }
}
