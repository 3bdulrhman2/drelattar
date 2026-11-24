import 'package:flutter/material.dart';

import '../../utils/clinic_time.dart';

import '../../models/appointment.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/booking_card.dart';

class AdminHomeTab extends StatefulWidget {
  final VoidCallback? onNavigateToBookings;
  final VoidCallback? onNavigateToWebsite;
  final List<Appointment>? previewAppointments;
  final bool canEditWebsite;
  const AdminHomeTab({
    super.key,
    this.onNavigateToBookings,
    this.onNavigateToWebsite,
    this.previewAppointments,
    this.canEditWebsite = true,
  });
  @override
  State<AdminHomeTab> createState() => _AdminHomeTabState();
}

class _AdminHomeTabState extends State<AdminHomeTab> {
  List<Appointment> _appointments = [];
  Map<String, dynamic>? _settings;
  bool _loading = true;
  @override
  void initState() {
    super.initState();
    _appointments =
        widget.previewAppointments ?? SupabaseService.cachedAppointments;
    _settings = SupabaseService.cachedSettings;
    _loading = _appointments.isEmpty && _settings == null;
    if (widget.previewAppointments != null) {
      _loading = false;
    } else {
      _load();
    }
  }

  Future<void> _load() async {
    final r = await Future.wait([
      SupabaseService.getAppointments(forceRefresh: true),
      SupabaseService.getClinicSettings(forceRefresh: true),
    ]);
    if (mounted)
      setState(() {
        _appointments = r[0] as List<Appointment>;
        _settings = r[1] as Map<String, dynamic>?;
        _loading = false;
      });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final now = DateTime.now();
    final date =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final today = _appointments.where((a) => a.appointmentDate == date).toList()
      ..sort((a, b) => a.appointmentTime.compareTo(b.appointmentTime));
    final pending = _appointments.where((a) => a.status == 'pending').length;
    final confirmed = today.where((a) => a.status == 'confirmed').length;
    final completed = today.where((a) => a.status == 'completed').length;
    final upcoming = today
        .where(
          (a) =>
              (a.status == 'pending' || a.status == 'confirmed') &&
              a.appointmentTime.compareTo(
                    '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}',
                  ) >=
                  0,
        )
        .toList();
    final closed =
        (_settings?['bookingSettings'] as Map?)?['isClosedToday'] == true;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
        children: [
          Text(
            context.night ? 'غرفة التحكم' : 'كل العيادة في نظرة',
            style: TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.bold,
              color: context.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'ملخص اليوم · ${now.year}-${now.month}-${now.day}',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(21),
            decoration: BoxDecoration(
              color: context.night ? const Color(0xFF203E62) : AppColors.royal,
              borderRadius: BorderRadius.circular(23),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.night ? 'يحتاج مراجعتك' : 'مواعيد اليوم',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 12),
                if (context.night)
                  Text(
                    '$pending طلبات جديدة',
                    style: const TextStyle(
                      fontSize: 27,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                else
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '${today.length}',
                        style: const TextStyle(
                          fontSize: 48,
                          height: 1.3,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 9),
                      const Text(
                        'حجوزات',
                        style: TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ],
                  ),
                const SizedBox(height: 14),
                if (context.night)
                  FilledButton(
                    onPressed: widget.onNavigateToBookings,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.lime,
                      foregroundColor: AppColors.darker,
                    ),
                    child: const Text('فتح الطلبات'),
                  )
                else
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '$confirmed مؤكدة',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                        ),
                      ),
                      Text(
                        '$pending تحتاج مراجعتك',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _stat(
                  context,
                  context.night ? 'مواعيد اليوم' : 'بانتظار التأكيد',
                  context.night ? '${today.length}' : '$pending',
                  context.night ? 'اليوم' : 'راجع الطلبات',
                  widget.onNavigateToBookings,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _stat(
                  context,
                  'الحجز القادم',
                  upcoming.isEmpty
                      ? 'لا يوجد'
                      : clinicTime(upcoming.first.appointmentTime),
                  upcoming.isEmpty ? 'لاحقاً' : 'اليوم',
                  widget.onNavigateToBookings,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Text(
            'وصول سريع',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: context.ink,
            ),
          ),
          const SizedBox(height: 12),
          _quick(
            context,
            Icons.calendar_month_outlined,
            'إدارة الحجوزات',
            'عرض الكل',
            widget.onNavigateToBookings,
          ),
          if (widget.canEditWebsite) const SizedBox(height: 10),
          if (widget.canEditWebsite)
            _quick(
              context,
              Icons.chat_bubble_outline,
              'إعلان الموقع',
              'تعديل',
              widget.onNavigateToWebsite,
            ),
          const SizedBox(height: 18),
          Row(
            children: [
              Icon(
                closed ? Icons.lock_outline : Icons.event_available_outlined,
                size: 18,
                color: context.accent,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  closed
                      ? 'حجوزات اليوم مغلقة'
                      : 'الحجوزات متاحة حسب إعدادات العيادة',
                  style: TextStyle(fontSize: 11, color: context.secondaryInk),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            'مواعيد اليوم',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: context.ink,
            ),
          ),
          const SizedBox(height: 10),
          if (today.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'لا توجد حجوزات اليوم',
                style: TextStyle(color: context.secondaryInk),
              ),
            )
          else
            ...today
                .take(5)
                .map(
                  (a) => BookingCard(
                    appointment: a,
                    onStatusChange: widget.previewAppointments != null
                        ? null
                        : (s) async {
                            await SupabaseService.updateAppointmentStatus(
                              a.id,
                              s,
                            );
                            await _load();
                          },
                  ),
                ),
          Text(
            'تم الكشف اليوم: $completed · إجمالي الحجوزات: ${_appointments.length}',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
        ],
      ),
    );
  }

  Widget _stat(
    BuildContext context,
    String label,
    String value,
    String caption,
    VoidCallback? tap,
  ) => InkWell(
    onTap: tap,
    borderRadius: BorderRadius.circular(18),
    child: Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: context.panel,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            textDirection: TextDirection.ltr,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: context.night ? context.accent : context.ink,
            ),
          ),
          const SizedBox(height: 8),
          Text(caption, style: TextStyle(fontSize: 10, color: context.accent)),
        ],
      ),
    ),
  );
  Widget _quick(
    BuildContext context,
    IconData icon,
    String text,
    String trailing,
    VoidCallback? tap,
  ) => Material(
    color: context.panel,
    borderRadius: BorderRadius.circular(13),
    child: InkWell(
      onTap: tap,
      borderRadius: BorderRadius.circular(13),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: context.ink),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: context.ink,
                ),
              ),
            ),
            Text(
              trailing,
              style: TextStyle(fontSize: 10, color: context.secondaryInk),
            ),
          ],
        ),
      ),
    ),
  );
}
