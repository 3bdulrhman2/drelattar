import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/material.dart';

import '../models/appointment.dart';
import '../models/reception_entry.dart';
import '../services/supabase_service.dart';
import '../services/reception_service.dart';
import '../theme/app_theme.dart';
import '../utils/clinic_time.dart';
import '../utils/shared_reception_queue.dart';

class ReceptionTab extends StatefulWidget {
  final List<Appointment>? previewAppointments;
  const ReceptionTab({super.key, this.previewAppointments});
  @override
  State<ReceptionTab> createState() => _ReceptionTabState();
}

class _ReceptionTabState extends State<ReceptionTab> {
  List<Appointment> _bookings = [];
  ReceptionSnapshot? _snapshot;
  Map<String, dynamic>? _settings;
  bool _loading = true, _busy = false;
  RealtimeChannel? _sync;
  Timer? _refresh, _clock;
  DateTime? _receivedAt;
  String? _error;
  @override
  void initState() {
    super.initState();
    if (widget.previewAppointments != null) {
      _bookings = widget.previewAppointments!;
      _loading = false;
    } else {
      _load();
      _clock = Timer.periodic(const Duration(minutes: 1), (_) {
        if (mounted) setState(() {});
      });
      try {
        _sync = Supabase.instance.client
            .channel('reception-patient-free-sync')
            .onPostgresChanges(
              event: PostgresChangeEvent.update,
              schema: 'public',
              table: 'clinic_booking_sync',
              callback: (_) {
                _refresh?.cancel();
                _refresh = Timer(const Duration(milliseconds: 250), () {
                  if (mounted) _load();
                });
              },
            )
            .subscribe();
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _refresh?.cancel();
    _clock?.cancel();
    final channel = _sync;
    if (channel != null) {
      Supabase.instance.client.removeChannel(channel);
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final r = await Future.wait([
        SupabaseService.getAppointments(forceRefresh: true),
        SupabaseService.getClinicSettings(forceRefresh: true),
        ReceptionService.snapshot(),
      ]);
      if (!mounted) return;
      setState(() {
        _bookings = r[0] as List<Appointment>;
        _settings = r[1] as Map<String, dynamic>?;
        _snapshot = r[2] as ReceptionSnapshot;
        _receivedAt = DateTime.now();
        _error = null;
        _loading = false;
      });
    } catch (_) {
      if (mounted)
        setState(() {
          _error = 'تعذر تحديث الدور. لم يتم تأكيد أي تغيير. أعد المحاولة.';
          _loading = false;
        });
    }
  }

  Future<void> _add() async {
    final controller = TextEditingController();
    final request = ReceptionService.requestId();
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) => AlertDialog(
          title: const Text('إضافة مريض للاستقبال'),
          content: TextField(
            controller: controller,
            maxLength: 120,
            decoration: const InputDecoration(labelText: 'اسم المريض'),
          ),
          actions: [
            TextButton(
              onPressed: _busy ? null : () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: _busy
                  ? null
                  : () async {
                      if (controller.text.trim().length < 2) return;
                      update(() => _busy = true);
                      try {
                        await ReceptionService.add(request, controller.text);
                        if (ctx.mounted) Navigator.pop(ctx);
                        await _load();
                      } catch (_) {
                        if (mounted)
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'تعذر تأكيد الإضافة. أعد المحاولة من نفس النافذة لتجنب التكرار.',
                              ),
                            ),
                          );
                      } finally {
                        _busy = false;
                        if (ctx.mounted) update(() {});
                      }
                    },
              child: Text(_busy ? 'جاري الحفظ' : 'إضافة للدور'),
            ),
          ],
        ),
      ),
    );
    controller.dispose();
  }

  Future<void> _status(ReceptionItem item, String value) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      if (item.source == 'website') {
        final ok = await SupabaseService.updateAppointmentStatus(
          item.id,
          value,
        );
        if (!ok) throw StateError('save failed');
      } else {
        await ReceptionService.status(item.id, value);
      }
      await _load();
    } catch (_) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('لم يتم تأكيد التغيير. حدّث الدور قبل المحاولة.'),
          ),
        );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final now = _snapshot == null
        ? DateTime.now()
        : _snapshot!.cairoNow.add(
            DateTime.now().difference(_receivedAt ?? DateTime.now()),
          );
    final date =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final online = _bookings
        .where((a) => a.appointmentDate == date && a.status != 'cancelled')
        .map(
          (a) => ReceptionItem(
            id: a.id,
            name: a.patientName,
            source: 'website',
            status: a.status,
            time: DateTime.parse('${a.appointmentDate}T${a.appointmentTime}'),
          ),
        )
        .toList();
    final b = Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
    final friday = now.weekday == DateTime.friday;
    DateTime? bound(String key) => DateTime.tryParse(
      '$date'
      'T${b[key] ?? ''}',
    );
    final opens = bound(friday ? 'startTimeFriday' : 'startTime'),
        closes = bound(friday ? 'endTimeFriday' : 'endTime');
    ReceptionSchedule? schedule;
    if (_snapshot != null &&
        opens != null &&
        closes != null &&
        closes.isAfter(opens))
      schedule = calculateReception(
        policy: ReceptionPolicy(opensAt: opens, closesAt: closes, now: now),
        website: online,
        walkIns: _snapshot!.entries
            .map(
              (e) => ReceptionItem(
                id: e.id,
                name: e.name,
                source: 'walkin',
                status: e.status,
                time: e.status == 'in_consultation'
                    ? (e.startedAt ?? e.arrivedAt)
                    : e.arrivedAt,
              ),
            )
            .toList(),
      );
    final items = schedule?.items ?? online;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
        children: [
          Text(
            'الاستقبال',
            style: TextStyle(
              fontSize: 25,
              fontWeight: FontWeight.bold,
              color: context.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'دور اليوم · كل كشف ربع ساعة',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          const SizedBox(height: 18),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
          FilledButton.icon(
            onPressed: _snapshot == null || _busy || schedule == null
                ? null
                : _add,
            icon: const Icon(Icons.person_add_alt),
            label: const Text('إضافة مريض بدون حجز'),
          ),
          const SizedBox(height: 12),
          Text(
            'الأوقات تقديرية للاستقبال. حجوزات الموقع ثابتة، والحجز المنتظر للتأكيد يحتفظ بوقته.',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          if (schedule == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'الدور المشترك غير جاهز أو مواعيد العمل غير متاحة. لا يتم حفظ أسماء محلياً.',
                style: TextStyle(fontSize: 11, color: context.secondaryInk),
              ),
            ),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'لا يوجد مرضى في دور اليوم',
                style: TextStyle(color: context.secondaryInk),
              ),
            ),
          ...items.map((item) => _tile(context, item)),
          if (schedule?.unplaced.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            const Text(
              'لا توجد مواعيد متبقية داخل وقت العمل',
              style: TextStyle(color: Colors.red),
            ),
            ...schedule!.unplaced.map(
              (i) => ListTile(
                title: Text(i.name),
                subtitle: const Text('لم يُخصص وقت، راجع الطبيب'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _tile(BuildContext context, ReceptionItem i) => Container(
    margin: const EdgeInsets.only(top: 10),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: context.panel,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      children: [
        Row(
          children: [
            Icon(
              i.source == 'website'
                  ? Icons.language_outlined
                  : Icons.person_outline,
              color: context.accent,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    i.name,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  Text(
                    i.status == 'pending'
                        ? 'في انتظار التأكيد'
                        : i.status == 'completed'
                        ? 'تم الكشف'
                        : i.status == 'in_consultation'
                        ? 'داخل الكشف'
                        : i.source == 'website'
                        ? 'حجز موقع'
                        : 'بدون حجز',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                ],
              ),
            ),
            Text(
              clinicTime(
                '${i.time.hour.toString().padLeft(2, '0')}:${i.time.minute.toString().padLeft(2, '0')}',
              ),
              style: TextStyle(
                color: context.accent,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        if (_snapshot != null && i.status != 'completed')
          Wrap(
            spacing: 8,
            children: [
              if (i.source == 'walkin' && i.status == 'waiting')
                TextButton(
                  onPressed: _busy ? null : () => _status(i, 'in_consultation'),
                  child: const Text('بدء الكشف'),
                ),
              if (i.status == 'in_consultation' ||
                  i.source == 'website' && i.status == 'confirmed')
                TextButton(
                  onPressed: _busy ? null : () => _status(i, 'completed'),
                  child: const Text('تم الكشف'),
                ),
            ],
          ),
      ],
    ),
  );
}
