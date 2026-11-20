class SocialReview {
  final String id;
  final String imageUrl;
  final String? title;
  final String? patientName;
  final String? platform;
  final String? date;
  final String? caption;

  SocialReview({
    required this.id,
    required this.imageUrl,
    this.title,
    this.patientName,
    this.platform,
    this.date,
    this.caption,
  });

  factory SocialReview.fromJson(Map<String, dynamic> json) {
    return SocialReview(
      id: json['id']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      title: json['title']?.toString(),
      patientName: json['patientName']?.toString(),
      platform: json['platform']?.toString() ?? 'whatsapp',
      date: json['date']?.toString(),
      caption: json['caption']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'imageUrl': imageUrl,
      'title': title,
      'patientName': patientName,
      'platform': platform,
      'date': date,
      'caption': caption,
    };
  }

  SocialReview copyWith({
    String? id,
    String? imageUrl,
    String? title,
    String? patientName,
    String? platform,
    String? date,
    String? caption,
  }) {
    return SocialReview(
      id: id ?? this.id,
      imageUrl: imageUrl ?? this.imageUrl,
      title: title ?? this.title,
      patientName: patientName ?? this.patientName,
      platform: platform ?? this.platform,
      date: date ?? this.date,
      caption: caption ?? this.caption,
    );
  }
}
