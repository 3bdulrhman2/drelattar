import 'package:flutter/material.dart';
import '../../models/appointment.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/booking_card.dart';

class SecretaryHomeTab extends StatefulWidget {
  final VoidCallback? onNavigateToBookings;

  const SecretaryHomeTab({super.key, this.onNavigateToBookings});

  @override
  State<SecretaryHomeTab> createState() => _SecretaryHomeTabState();
}

class _SecretaryHomeTabState extends State<SecretaryHomeTab> {
  List<Appointment> _appointments = [];
  Map<String, dynamic>? _settings;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _appointments = SupabaseService.cachedAppointments;
    _settings = SupabaseService.cachedSettings;
    _isLoading = _appointments.isEmpty && _settings == null;
    _loadData();
  }

  Future<void> _loadData({bool forceRefresh = false}) async {
    if (_appointments.isEmpty && _settings == null) {
      setState(() => _isLoading = true);
    }
    final results = await Future.wait([
      SupabaseService.getAppointments(forceRefresh: forceRefresh),
      SupabaseService.getClinicSettings(forceRefresh: forceRefresh),
    ]);

    if (!mounted) return;

    setState(() {
      _appointments = results[0] as List<Appointment>;
      _settings = results[1] as Map<String, dynamic>?;
      _isLoading = false;
    });
  }

  String _getTodayString() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _appointments.isEmpty && _settings == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.royal));
    }

    final todayStr = _getTodayString();
    final todayAppointments =
        _appointments.where((a) => a.appointmentDate == todayStr).toList();
    final pendingToday =
        todayAppointments.where((a) => a.status == 'pending').length;
    final confirmedToday =
        todayAppointments.where((a) => a.status == 'confirmed').length;
    final completedToday =
        todayAppointments.where((a) => a.status == 'completed').length;

    final bookingSettings =
        Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
    final isClosedToday = bookingSettings['isClosedToday'] == true;

    return RefreshIndicator(
      onRefresh: () => _loadData(forceRefresh: true),
      color: AppColors.royal,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isClosedToday ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isClosedToday ? const Color(0xFFFCA5A5) : const Color(0xFF86EFAC),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isClosedToday ? Colors.red.shade100 : Colors.green.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isClosedToday ? Icons.lock : Icons.check_circle,
                      color: isClosedToday ? Colors.red.shade700 : Colors.green.shade700,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isClosedToday ? 'حجوزات اليوم مغلقة' : 'العيادة تستقبل الحجوزات اليوم',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isClosedToday ? Colors.red.shade900 : Colors.green.shade900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isClosedToday
                              ? (bookingSettings['closedTodayReason']?.isNotEmpty == true
                                  ? bookingSettings['closedTodayReason']
                                  : 'تم إيقاف حجز الكشوفات الجديدة لليوم')
                              : 'المواعيد الشاغرة متاحة للحجز بالموقع',
                          style: TextStyle(
                            fontSize: 11,
                            color: isClosedToday ? Colors.red.shade700 : Colors.green.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Statistics Header
            const Text(
              'حجوزات اليوم بالعيادة',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
            ),
            const SizedBox(height: 12),

            // Grid of Stat Cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                StatCard(
                  title: 'إجمالي اليوم',
                  value: todayAppointments.length.toString(),
                  icon: Icons.calendar_today,
                  color: AppColors.royal,
                ),
                StatCard(
                  title: 'بانتظار التأكيد',
                  value: pendingToday.toString(),
                  icon: Icons.hourglass_top,
                  color: const Color(0xFFD97706),
                ),
                StatCard(
                  title: 'تم تأكيدها',
                  value: confirmedToday.toString(),
                  icon: Icons.check_circle_outline,
                  color: const Color(0xFF059669),
                ),
                StatCard(
                  title: 'تم الكشف',
                  value: completedToday.toString(),
                  icon: Icons.done_all,
                  color: const Color(0xFF2563EB),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Today's Appointments Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'مواعيد اليوم (${todayAppointments.length})',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.dark,
                  ),
                ),
                if (widget.onNavigateToBookings != null)
                  TextButton(
                    onPressed: widget.onNavigateToBookings,
                    child: const Text('عرض الكل'),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            if (todayAppointments.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.event_available, size: 48, color: AppColors.muted),
                    SizedBox(height: 8),
                    Text(
                      'لا توجد حجوزات مجدولة لهذا اليوم',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.muted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: todayAppointments.take(5).length,
                itemBuilder: (context, index) {
                  final appt = todayAppointments[index];
                  return BookingCard(
                    appointment: appt,
                    onStatusChange: (newStatus) async {
                      await SupabaseService.updateAppointmentStatus(appt.id, newStatus);
                      _loadData();
                    },
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
