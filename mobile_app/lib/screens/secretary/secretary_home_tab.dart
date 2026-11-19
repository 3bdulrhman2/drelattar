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
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
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
      onRefresh: _loadData,
      color: AppColors.royal,
      child: SingleChildScrollView(
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
              ),
              child: Row(
                children: [
                  Icon(
                    isClosedToday ? Icons.event_busy : Icons.check_circle_outline,
                    color: Colors.white,
                    size: 26,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isClosedToday ? 'حجوزات اليوم مغلقة' : 'الحجز مفتوح اليوم',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          isClosedToday
                              ? 'لا يتم استقبال مواعيد جديدة لليوم'
                              : 'يمكن للمرضى حجز المواعيد المتاحة',
                          style: const TextStyle(fontSize: 11, color: Colors.white70),
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
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: const Size(0, 34),
                    ),
                    child: Text(
                      isClosedToday ? 'فتح الحجز' : 'إغلاق اليوم',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Today Stats
            const Text(
              'حجوزات اليوم',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.dark,
              ),
            ),
            const SizedBox(height: 12),

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
                  title: 'مؤكدة',
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
                  'مواعيد اليوم القادمة',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.dark,
                  ),
                ),
                if (widget.onNavigateToBookings != null)
                  TextButton(
                    onPressed: widget.onNavigateToBookings,
                    child: const Text('عرض الكل', style: TextStyle(fontSize: 12, color: AppColors.royal)),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            if (todayAppointments.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Text(
                  'لا توجد حجوزات لليوم حتى الآن',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.muted),
                ),
              )
            else
              ...todayAppointments.map((appt) => BookingCard(
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
