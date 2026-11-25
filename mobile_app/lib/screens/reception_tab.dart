import 'dart:async';

import 'package:timezone/data/latest.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/material.dart';

import '../models/appointment.dart';
import '../models/reception_entry.dart';
import '../services/supabase_service.dart';
import '../services/reception_service.dart';
import '../services/widget_service.dart';
import '../theme/app_theme.dart';
import '../utils/clinic_time.dart';
import '../utils/shared_reception_queue.dart';

class ReceptionTab extends StatefulWidget {
  final List<Appointment>? previewAppointments;
  final ReceptionSnapshot? previewSnapshot;
  final Map<String, dynamic>? previewSettings;
  const ReceptionTab({
    super.key,
    this.previewAppointments,
    this.previewSnapshot,
    this.previewSettings,
  });
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
    tzdata.initializeTimeZones();
    if (widget.previewAppointments != null) {
      _bookings = widget.previewAppointments!;
      _snapshot = widget.previewSnapshot;
      _settings = widget.previewSettings;
      _receivedAt = DateTime.now();
      _loading = false;
    } else {
      SupabaseService.appointmentChanges.addListener(_reloadBookings);
      _load();
      _clock = Timer.periodic(const Duration(minutes: 1), (_) {
        if (!mounted) return;
        final server = _snapshot?.cairoNow;
        if (server != null) {
          final live = server.add(
            DateTime.now().difference(_receivedAt ?? DateTime.now()),
          );
          if (!DateUtils.isSameDay(server, live)) {
            _load();
            return;
          }
        }
        setState(() {});
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

  void _reloadBookings() {
    if (mounted) _load();
  }

  @override
  void dispose() {
    SupabaseService.appointmentChanges.removeListener(_reloadBookings);
    _refresh?.cancel();
    _clock?.cancel();
    final channel = _sync;
    if (channel != null) {
      Supabase.instance.client.removeChannel(channel);
    }
    super.dispose();
  }

  Future<void> _load() async {
    if (widget.previewAppointments != null) return;
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
        WidgetService.walkIns = _snapshot!.entries;
        WidgetService.pushAppointments(_bookings);
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
    if (widget.previewAppointments != null) return;
    final controller = TextEditingController();
    final request = ReceptionService.requestId();
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, update) => AlertDialog(
          title: const Text('إضافة مريض لقائمة انتظار اليوم'),
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
                        if (mounted) setState(() => _busy = false);
                        if (ctx.mounted) update(() {});
                      }
                    },
              child: Text(_busy ? 'جاري الحفظ' : 'إضافة للانتظار'),
            ),
          ],
        ),
      ),
    );
    controller.dispose();
  }

  Future<void> _status(ReceptionItem item, String value) async {
    if (_busy || widget.previewAppointments != null) return;
    if (value == 'in_consultation') {
      final current =
          _snapshot?.entries.any(
                (e) =>
                    DateUtils.isSameDay(e.arrivedAt, _snapshot!.cairoNow) &&
                    e.status == 'in_consultation',
              ) ==
              true ||
          _bookings.any(
            (b) =>
                b.appointmentDate ==
                    _dayKey(_snapshot?.cairoNow ?? DateTime.now()) &&
                b.status == 'in_consultation',
          );
      if (current) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'أنهِ الكشف الحالي أولاً، وباقي المرضى يفضلوا في الانتظار',
            ),
          ),
        );
        return;
      }
      final yes = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('بدء الكشف؟'),
          content: Text('نقل ${item.name} من قائمة الانتظار إلى الدور الحالي؟'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('يفضل في الانتظار'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('ابدأ الكشف'),
            ),
          ],
        ),
      );
      if (yes != true || !mounted) return;
    }
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

  String _dayKey(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
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
            .where((e) => DateUtils.isSameDay(e.arrivedAt, now))
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
    final unplaced = schedule?.unplaced ?? <ReceptionItem>[];
    final all = [...items, ...unplaced];
    final visible = all
        .where(
          (i) =>
              i.source != 'website' ||
              ['arrived', 'in_consultation', 'completed'].contains(i.status),
        )
        .toList();
    DateTime registeredAt(ReceptionItem item) {
      if (item.source == 'website') {
        final booking = _bookings.where((b) => b.id == item.id).firstOrNull;
        final created = DateTime.tryParse(booking?.createdAt ?? '');
        if (created == null) return item.time;
        if (!created.isUtc) return created;
        final wall = tz.TZDateTime.from(
          created,
          tz.getLocation('Africa/Cairo'),
        );
        return DateTime(
          wall.year,
          wall.month,
          wall.day,
          wall.hour,
          wall.minute,
          wall.second,
        );
      }
      return _snapshot?.entries
              .where((e) => e.id == item.id)
              .firstOrNull
              ?.arrivedAt ??
          item.time;
    }

    final registered =
        all
            .where(
              (i) => i.source != 'website' || !['cancelled'].contains(i.status),
            )
            .toList()
          ..sort((a, b) {
            final order = registeredAt(a).compareTo(registeredAt(b));
            return order != 0 ? order : a.id.compareTo(b.id);
          });
    final current = visible
        .where((i) => i.status == 'in_consultation')
        .firstOrNull;
    final waiting = visible
        .where((i) => !['completed', 'in_consultation'].contains(i.status))
        .toList();
    final completed = registered.where((i) => i.status == 'completed').toList();
    final interactive = _snapshot != null && !_busy;
    // Next call follows the existing calculated queue, not display numbering.
    final next = visible
        .where((i) => !['completed', 'in_consultation'].contains(i.status))
        .firstOrNull;
    String number(ReceptionItem i) =>
        _digits((registered.indexOf(i) + 1).toString().padLeft(2, '0'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
        children: [
          Text(
            'الدور والاستقبال',
            style: TextStyle(
              fontSize: 23,
              fontWeight: FontWeight.bold,
              color: context.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'قائمة اليوم · ${_digits(date)}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: context.accent,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'الأرقام حسب التسجيل · العرض حسب موعد الكشف',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          const SizedBox(height: 18),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF173F94),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'الدور الحالي',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 8),
                Text(
                  current == null ? '—' : number(current),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 44,
                    fontWeight: FontWeight.bold,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  current?.name ?? 'لا يوجد مريض داخل الكشف',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (current != null) ...[
                  const SizedBox(height: 12),
                  Align(
                    alignment: AlignmentDirectional.centerEnd,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        foregroundColor: Colors.white,
                      ),
                      onPressed: interactive
                          ? () => _status(current, 'completed')
                          : null,
                      child: const Text('إنهاء الزيارة'),
                    ),
                  ),
                ],
              ],
            ),
          ),
          ...visible
              .where((i) => i.status == 'in_consultation' && i != current)
              .map(
                (i) => _queueCard(context, i, number(i), false, interactive),
              ),
          const SizedBox(height: 22),
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  color: Color(0xFF173F94),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  onPressed: interactive && schedule != null ? _add : null,
                  tooltip: 'إضافة مريض',
                  icon: const Icon(
                    Icons.person_add_alt,
                    color: Colors.white,
                    size: 21,
                  ),
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  'قائمة الانتظار',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: context.ink,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: context.panel,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Text(
                  '${_digits(waiting.length.toString())} متبقين',
                  style: TextStyle(fontSize: 11, color: context.secondaryInk),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (waiting.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'لا يوجد مرضى في قائمة الانتظار',
                style: TextStyle(color: context.secondaryInk),
              ),
            ),
          ...waiting.map(
            (i) => _queueCard(
              context,
              i,
              number(i),
              unplaced.contains(i),
              interactive,
            ),
          ),
          if (waiting.isNotEmpty) ...[
            const SizedBox(height: 16),
            FilledButton(
              onPressed:
                  interactive &&
                      current == null &&
                      ['waiting', 'arrived'].contains(next?.status)
                  ? () => _status(next!, 'in_consultation')
                  : null,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 17),
              ),
              child: const Text(
                'بدء كشف التالي',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
          if (current != null && waiting.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(
                'المرضى في الانتظار حتى إنهاء الكشف الحالي وبدء كشف جديد.',
                style: TextStyle(fontSize: 11, color: context.secondaryInk),
              ),
            ),
          const SizedBox(height: 14),
          Text(
            'الأوقات تقديرية للاستقبال. حجوزات الموقع ثابتة، والحجز المنتظر للتأكيد يحتفظ بوقته.',
            style: TextStyle(fontSize: 11, color: context.secondaryInk),
          ),
          if (schedule == null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                'الدور المشترك غير جاهز أو مواعيد العمل غير متاحة. لا يتم حفظ أسماء محلياً.',
                style: TextStyle(fontSize: 11, color: context.secondaryInk),
              ),
            ),
          if (unplaced.isNotEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text(
                'بعض المرضى بدون موعد متاح داخل وقت العمل',
                style: TextStyle(fontSize: 11, color: Colors.red),
              ),
            ),
          if (completed.isNotEmpty) ...[
            const SizedBox(height: 18),
            ExpansionTile(
              key: const PageStorageKey('reception-completed'),
              initiallyExpanded: false,
              tilePadding: const EdgeInsets.symmetric(horizontal: 4),
              title: Text(
                'تم الكشف (${_digits(completed.length.toString())})',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: context.ink,
                ),
              ),
              children: completed
                  .map((i) => _queueCard(context, i, number(i), false, false))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }

  String _digits(String value) {
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    return value.replaceAllMapped(
      RegExp(r'[0-9]'),
      (m) => arabic[int.parse(m[0]!)],
    );
  }

  Widget _queueCard(
    BuildContext context,
    ReceptionItem i,
    String number,
    bool unscheduled,
    bool interactive,
  ) => Container(
    margin: const EdgeInsets.only(top: 10),
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 17),
    decoration: BoxDecoration(
      color: context.panel,
      borderRadius: BorderRadius.circular(19),
    ),
    child: Row(
      children: [
        Text(
          number,
          style: TextStyle(
            color: context.accent,
            fontSize: 29,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 15),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                i.name,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: context.ink,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${unscheduled ? 'بدون موعد متاح' : clinicTime('${i.time.hour.toString().padLeft(2, '0')}:${i.time.minute.toString().padLeft(2, '0')}')} · ${i.status == 'pending'
                    ? 'في انتظار التأكيد'
                    : i.status == 'arrived'
                    ? 'حضر العيادة'
                    : i.status == 'completed'
                    ? 'تم الكشف'
                    : i.status == 'in_consultation'
                    ? 'داخل الكشف'
                    : i.source == 'website'
                    ? 'مؤكد · حجز موقع'
                    : 'في الانتظار'}',
                style: TextStyle(fontSize: 10, color: context.secondaryInk),
              ),
            ],
          ),
        ),
        if (i.status == 'in_consultation' ||
            i.status == 'arrived' ||
            i.status == 'waiting' && i.source == 'walkin')
          PopupMenuButton<String>(
            enabled:
                interactive &&
                (i.status == 'in_consultation' ||
                    !(_snapshot?.entries.any(
                              (e) => e.status == 'in_consultation',
                            ) ==
                            true ||
                        _bookings.any(
                          (b) =>
                              b.appointmentDate ==
                                  _dayKey(
                                    _snapshot?.cairoNow ?? DateTime.now(),
                                  ) &&
                              b.status == 'in_consultation',
                        ))),
            icon: Icon(
              Icons.chevron_left,
              color: context.secondaryInk,
              size: 19,
            ),
            onSelected: (value) => _status(i, value),
            itemBuilder: (_) => [
              PopupMenuItem(
                value: i.status == 'in_consultation'
                    ? 'completed'
                    : 'in_consultation',
                child: Text(
                  i.status == 'in_consultation' ? 'تم الكشف' : 'بدء الكشف',
                ),
              ),
            ],
          )
        else
          Icon(Icons.chevron_left, color: context.secondaryInk, size: 19),
      ],
    ),
  );
}
