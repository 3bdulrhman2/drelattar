class SecretaryAccount {
  final String id;
  final String username;
  final String name;
  final String? phone;
  final bool isActive;
  final String createdAt;

  SecretaryAccount({
    required this.id,
    required this.username,
    required this.name,
    this.phone,
    this.isActive = true,
    required this.createdAt,
  });

  factory SecretaryAccount.fromJson(Map<String, dynamic> json) {
    return SecretaryAccount(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString(),
      isActive: json['isActive'] != false && json['is_active'] != false,
      createdAt:
          json['createdAt']?.toString() ?? json['created_at']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'name': name,
      'phone': phone,
      'isActive': isActive,
      'createdAt': createdAt,
    };
  }

  SecretaryAccount copyWith({
    String? id,
    String? username,
    String? name,
    String? phone,
    bool? isActive,
    String? createdAt,
  }) {
    return SecretaryAccount(
      id: id ?? this.id,
      username: username ?? this.username,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
