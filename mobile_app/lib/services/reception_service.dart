import 'dart:math';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/reception_entry.dart';

class ReceptionService {
  static SupabaseClient get _client => Supabase.instance.client;
  static String requestId() {
    final r = Random.secure();
    final b = List.generate(16, (_) => r.nextInt(256));
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
    return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
  }

  static Future<ReceptionSnapshot> snapshot() async =>
      ReceptionSnapshot.fromJson(
        Map<String, dynamic>.from(
          await _client.rpc('clinic_reception_snapshot'),
        ),
      );
  static Future<Map<String, dynamic>?> add(String requestId, String name) async {
    final r = await _client.rpc(
      'add_clinic_walkin',
      params: {'p_request_id': requestId, 'p_name': name.trim()},
    );
    final rows = r is List ? r : [r];
    if (rows.isEmpty || rows.first == null) return null;
    return Map<String, dynamic>.from(rows.first as Map);
  }

  static Future<void> status(String id, String status) async {
    await _client.rpc(
      'set_clinic_walkin_status',
      params: {'p_id': id, 'p_status': status},
    );
  }
}
