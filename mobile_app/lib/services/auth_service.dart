import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'notification_service.dart';

enum UserRole { admin, secretary }

class AppUser {
  final String name;
  final String identifier;
  final UserRole role;

  AppUser({required this.name, required this.identifier, required this.role});

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

/// Authentication now goes through Supabase Auth, exactly like the website
/// admin/secretary dashboards. Staff membership and role come from the
/// backend `clinic_staff` table; there are no credentials embedded in the app.
class AuthService {
  static const String _userKey = 'current_app_user_v2';

  static AppUser? currentUser;

  static SupabaseClient? get _client {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null; // Supabase not initialized (missing build config)
    }
  }

  /// Resolves the signed-in auth user against clinic_staff.
  /// Returns null when there is no session or the user is not active staff.
  static Future<AppUser?> _resolveStaff() async {
    final client = _client;
    final authUser = client?.auth.currentUser;
    if (client == null || authUser == null) return null;
    try {
      final row = await client
          .from('clinic_staff')
          .select('user_id,role,name,is_active')
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .maybeSingle();
      if (row == null) return null;
      final roleStr = row['role']?.toString() ?? '';
      final role = roleStr == 'admin'
          ? UserRole.admin
          : roleStr == 'secretary'
          ? UserRole.secretary
          : null;
      if (role == null) return null;
      return AppUser(
        name: row['name']?.toString() ?? '',
        identifier: authUser.email ?? '',
        role: role,
      );
    } catch (_) {
      return null;
    }
  }

  /// Restores the staff user on app start when a genuine backend session
  /// exists. A stored profile alone never grants access.
  static Future<AppUser?> loadUser() async {
    final client = _client;
    if (client == null || client.auth.currentSession == null) {
      await _clearStoredUser();
      currentUser = null;
      return null;
    }
    final staff = await _resolveStaff();
    if (staff == null) {
      await _clearStoredUser();
      currentUser = null;
      return null;
    }
    await _saveUser(staff);
    NotificationService.startRealtimeListener();
    return staff;
  }

  /// Unified staff sign-in (admin and secretary alike); the backend decides
  /// the role. Returns true only for an active staff account.
  static Future<bool> login(String email, String password) async {
    final client = _client;
    if (client == null) return false;
    try {
      await client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      final staff = await _resolveStaff();
      if (staff == null) {
        await client.auth.signOut();
        return false;
      }
      await _saveUser(staff);
      NotificationService.startRealtimeListener();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Kept for the existing login screen; both paths use the same backend
  /// sign-in and the returned role comes from clinic_staff.
  static Future<bool> loginAdmin(String email, String password) =>
      login(email, password);

  static Future<bool> loginSecretary(String email, String password) =>
      login(email, password);

  static Future<void> _saveUser(AppUser user) async {
    currentUser = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  static Future<void> _clearStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  static Future<void> logout() async {
    currentUser = null;
    NotificationService.stopRealtimeListener();
    await _clearStoredUser();
    try {
      await _client?.auth.signOut();
    } catch (_) {}
  }
}
