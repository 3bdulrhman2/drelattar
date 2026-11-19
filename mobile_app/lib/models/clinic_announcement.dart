class ClinicAnnouncement {
  final String id;
  final String title;
  final String content;
  final String? startDate;
  final String? endDate;
  final bool isActive;
  final String type; // 'info' | 'warning' | 'alert' | 'closure'
  final String createdBy;
  final String createdAt;

  ClinicAnnouncement({
    required this.id,
    required this.title,
    required this.content,
    this.startDate,
    this.endDate,
    this.isActive = true,
    this.type = 'info',
    this.createdBy = 'admin',
    required this.createdAt,
  });

  factory ClinicAnnouncement.fromJson(Map<String, dynamic> json) {
    return ClinicAnnouncement(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      isActive: json['isActive'] == true,
      type: json['type']?.toString() ?? 'info',
      createdBy: json['createdBy']?.toString() ?? 'admin',
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'startDate': startDate,
      'endDate': endDate,
      'isActive': isActive,
      'type': type,
      'createdBy': createdBy,
      'createdAt': createdAt,
    };
  }
}
