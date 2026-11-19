import 'package:flutter/material.dart';
import '../../models/appointment.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/booking_card.dart';

class AdminHomeTab extends StatefulWidget {
  final VoidCallback? onNavigateToBookings;

  const AdminHomeTab({super.key, this.onNavigateToBookings});

  @override
  State<AdminHomeTab> createState() => _AdminHomeTabState();
}

class _AdminHomeTabState extends State<AdminHomeTab> {
  List<Appointment> _appointments = [];
  Map<String, dynamic>? _settings;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final results = await Future.wait([
      SupabaseService.getAppointments(),
      SupabaseService.getClinicSettings(),
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
    final y = now.year;
    final m = now.month.toString().padLeft(2, '0');
    final d = now.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.royal),
      );
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
      onRefresh: _loadData,
      color: AppColors.royal,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isClosedToday
                      ? [const Color(0xFFE11D48), const Color(0xFFBE123C)]
                      : [AppColors.royal, AppColors.medical],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1F123E91),
                    blurRadius: 16,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      isClosedToday ? Icons.event_busy : Icons.check_circle_outline,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isClosedToday
                              ? 'الحجز متوقف اليوم بالعيادة'
                              : 'العيادة تستقبل الحجوزات اليوم',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isClosedToday
                              ? 'يمكنك إعادة فتح المواعيد للمرضى بضغطة واحدة'
                              : 'المواعيد تظهر للزوار على موقع elattar.site',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () async {
                      await SupabaseService.toggleCloseToday(!isClosedToday);
                      _loadData();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor:
                          isClosedToday ? Colors.red.shade700 : AppColors.royal,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      minimumSize: const Size(0, 36),
                      elevation: 0,
                    ),
                    child: Text(
                      isClosedToday ? 'إعادة فتح' : 'إغلاق اليوم',
                      style: const TextStyle(
                          fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Section Header
            const Text(
              'إحصائيات حجوزات اليوم',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
            ),
            const SizedBox(height: 12),

            // Stats Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
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
                  icon: Icons.access_time,
                  color: AppColors.statusPending,
                ),
                StatCard(
                  title: 'حجوزات مؤكدة',
                  value: confirmedToday.toString(),
                  icon: Icons.done_all,
                  color: AppColors.statusConfirmed,
                ),
                StatCard(
                  title: 'تم الكشف',
                  value: completedToday.toString(),
                  icon: Icons.task_alt,
                  color: AppColors.statusCompleted,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Next Appointments Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'المواعيد القادمة اليوم',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.dark,
                  ),
                ),
                if (widget.onNavigateToBookings != null)
                  TextButton(
                    onPressed: widget.onNavigateToBookings,
                    child: const Text(
                      'عرض الكل',
                      style: TextStyle(fontSize: 12, color: AppColors.royal),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            if (todayAppointments.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.event_available, size: 36, color: AppColors.muted),
                    SizedBox(height: 8),
                    Text(
                      'لا توجد حجوزات مسجلة اليوم حتى الآن',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              )
            else
              ...todayAppointments.take(3).map((appt) => BookingCard(
                    appointment: appt,
                    onStatusChange: (status) async {
                      await SupabaseService.updateAppointmentStatus(appt.id, status);
                      _loadData();
                    },
                  )),
          ],
        ),
      ),
    );
  }
}
