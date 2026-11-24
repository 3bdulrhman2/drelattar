import 'package:flutter/material.dart';

import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/clinic_time.dart';
import '../staff_push_screen.dart';

/// Live settings are admin-write only. Secretary sees the schedule, never false saves.
class SecretaryAvailabilityTab extends StatefulWidget {
  const SecretaryAvailabilityTab({super.key});
  @override
  State<SecretaryAvailabilityTab> createState() =>
      _SecretaryAvailabilityTabState();
}

class _SecretaryAvailabilityTabState extends State<SecretaryAvailabilityTab> {
  Map<String, dynamic>? _settings;
  bool _loading = true;
  @override
  void initState() {
    super.initState();
    _settings = SupabaseService.cachedSettings;
    _load();
  }

  Future<void> _load() async {
    final s = await SupabaseService.getClinicSettings(forceRefresh: true);
    if (mounted)
      setState(() {
        _settings = s;
        _loading = false;
      });
  }

  @override
  Widget build(BuildContext context) {
    final b = Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
    final closed = b['isClosedToday'] == true;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
        children: [
          Text(
            'تنظيم المواعيد',
            style: TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.bold,
              color: context.ink,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'عرض إعدادات العيادة',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const StaffPushScreen()),
            ),
            icon: const Icon(Icons.notifications_outlined),
            label: const Text('إشعارات فريق العيادة'),
          ),
          if (_loading && _settings == null)
            const Center(child: CircularProgressIndicator())
          else ...[
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        closed
                            ? Icons.lock_outline
                            : Icons.event_available_outlined,
                        color: context.accent,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        closed
                            ? 'حجوزات اليوم مغلقة'
                            : 'الحجوزات متاحة حسب الإعدادات',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'مواعيد العمل',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${(b['startTime'] == null ? 'غير محدد' : clinicTime(b['startTime'].toString()))} - ${(b['endTime'] == null ? 'غير محدد' : clinicTime(b['endTime'].toString()))}',
                    style: TextStyle(color: context.secondaryInk),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'الجمعة',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${(b['startTimeFriday'] == null ? 'غير محدد' : clinicTime(b['startTimeFriday'].toString()))} - ${(b['endTimeFriday'] == null ? 'غير محدد' : clinicTime(b['endTimeFriday'].toString()))}',
                    style: TextStyle(color: context.secondaryInk),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.admin_panel_settings_outlined,
                    color: context.accent,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'تغيير الإجازات وفتح أو إغلاق الحجز متاح للطبيب فقط. يمكنك مراجعة المواعيد وإدارة حالة الحجوزات من حسابك.',
                      style: TextStyle(
                        fontSize: 12,
                        color: context.secondaryInk,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
