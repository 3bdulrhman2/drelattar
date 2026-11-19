import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'supabase_service.dart';

enum UserRole { admin, secretary }

class AppUser {
  final String name;
  final String identifier;
  final UserRole role;

  AppUser({
    required this.name,
    required this.identifier,
    required this.role,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'identifier': identifier,
        'role': role == UserRole.admin ? 'admin' : 'secretary',
      };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        name: json['name'] ?? '',
        identifier: json['identifier'] ?? '',
        role: json['role'] == 'admin' ? UserRole.admin : UserRole.secretary,
      );
}

class AuthService {
  static const String _userKey = 'current_app_user_v1';

  static AppUser? currentUser;

  static Future<AppUser?> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_userKey);
    if (jsonStr != null) {
      try {
        currentUser = AppUser.fromJson(jsonDecode(jsonStr));
        return currentUser;
      } catch (_) {}
    }
    return null;
  }

  static Future<bool> loginAdmin(String email, String password) async {
    final cleanEmail = email.trim();
    final cleanPass = password.trim();

    // Standard clinic master credentials
    if (cleanEmail == 'admin@drelattar.com' && cleanPass == 'DrElattar2026!') {
      final user = AppUser(
        name: 'د. محمد السيد العطار (إدارة العيادة)',
        identifier: cleanEmail,
        role: UserRole.admin,
      );
      await _saveUser(user);
      return true;
    }

    return false;
  }

  static Future<bool> loginSecretary(String username, String password) async {
    final cleanUser = username.trim().toLowerCase();
    final cleanPass = password.trim();

    // Default fallback secretary account
    if (cleanUser == 'secretary' && cleanPass == 'ElattarSecretary2026!') {
      final user = AppUser(
        name: 'مشرف الحجوزات الرئيسي',
        identifier: cleanUser,
        role: UserRole.secretary,
      );
      await _saveUser(user);
      return true;
    }

    // Check remote accounts
    final accounts = await SupabaseService.getSecretaryAccounts();
    for (final acc in accounts) {
      if (acc.username.toLowerCase() == cleanUser && acc.passwordHash == cleanPass) {
        if (!acc.isActive) return false;
        final user = AppUser(
          name: acc.name,
          identifier: acc.username,
          role: UserRole.secretary,
        );
        await _saveUser(user);
        return true;
      }
    }

    return false;
  }

  static Future<void> _saveUser(AppUser user) async {
    currentUser = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> logout() async {
    currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }
}
