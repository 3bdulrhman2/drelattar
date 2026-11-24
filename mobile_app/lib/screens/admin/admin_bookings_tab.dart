import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;

import '../../models/appointment.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/clinic_time.dart';
import '../../widgets/booking_card.dart';

class AdminBookingsTab extends StatefulWidget {
  final List<Appointment>? previewAppointments;
  const AdminBookingsTab({super.key, this.previewAppointments});
  @override
  State<AdminBookingsTab> createState() => _AdminBookingsTabState();
}

class _AdminBookingsTabState extends State<AdminBookingsTab> {
  List<Appointment> _all = [];
  bool _loading = true;
  String _query = '', _status = 'all', _range = 'day';
  DateTime _day = DateUtils.dateOnly(DateTime.now());
  final _search = TextEditingController();
  @override
  void initState() {
    super.initState();
    _all = widget.previewAppointments ?? SupabaseService.cachedAppointments;
    if (widget.previewAppointments != null) {
      _loading = false;
    } else {
      _load();
    }
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  String _date(DateTime d) => DateFormat('yyyy-MM-dd', 'en').format(d);
  Future<void> _load() async {
    final all = await SupabaseService.getAppointments(forceRefresh: true);
    if (mounted)
      setState(() {
        _all = all;
        _loading = false;
      });
  }

  List<Appointment> get _filtered {
    final today = _date(DateTime.now());
    final list =
        _all.where((a) {
          final search =
              _query.isEmpty ||
              a.patientName.toLowerCase().contains(_query.toLowerCase()) ||
              a.patientPhone.contains(_query) ||
              a.id.toLowerCase().contains(_query.toLowerCase());
          final matchDate = switch (_range) {
            'day' => a.appointmentDate == _date(_day),
            'upcoming' => a.appointmentDate.compareTo(today) >= 0,
            'past' => a.appointmentDate.compareTo(today) < 0,
            _ => true,
          };
          return search &&
              matchDate &&
              (_status == 'all' || a.status == _status);
        }).toList()..sort((a, b) {
          final d = a.appointmentDate.compareTo(b.appointmentDate);
          return d != 0 ? d : a.appointmentTime.compareTo(b.appointmentTime);
        });
    return list;
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _day,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (d != null && mounted)
      setState(() {
        _day = d;
        _range = 'day';
      });
  }

  Future<void> _statusChange(Appointment a, String status) async {
    if (widget.previewAppointments != null) return;
    final ok = await SupabaseService.updateAppointmentStatus(a.id, status);
    if (!ok && mounted)
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذر حفظ التغيير. حاول مرة أخرى')),
      );
    await _load();
  }

  Future<void> _delete(Appointment a) async {
    if (widget.previewAppointments != null) return;
    final yes = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('حذف الحجز'),
        content: Text('حذف حجز ${a.patientName}؟ لا يمكن التراجع.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('تراجع'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('حذف', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (yes == true) {
      final ok = await SupabaseService.deleteAppointment(a.id);
      if (!ok && mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('تعذر حذف الحجز')));
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = _filtered;
    final start = _day.subtract(const Duration(days: 2));
    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 8, 18, 6),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'جدول اليوم',
                          style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.bold,
                            color: context.ink,
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: _pickDate,
                        child: const Text('اختيار التاريخ'),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => setState(
                          () => _day = _day.subtract(const Duration(days: 5)),
                        ),
                        tooltip: 'أيام سابقة',
                        icon: const Icon(Icons.chevron_right),
                      ),
                      Expanded(
                        child: Text(
                          DateFormat('MMMM yyyy', 'ar').format(_day),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            color: context.secondaryInk,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(
                          () => _day = _day.add(const Duration(days: 5)),
                        ),
                        tooltip: 'أيام تالية',
                        icon: const Icon(Icons.chevron_left),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Row(
                    children: List.generate(5, (i) {
                      final d = start.add(Duration(days: i));
                      final selected =
                          _range == 'day' && _date(d) == _date(_day);
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsetsDirectional.only(
                            end: i < 4 ? 8 : 0,
                          ),
                          child: Material(
                            color: selected ? AppColors.royal : context.panel,
                            borderRadius: BorderRadius.circular(15),
                            child: InkWell(
                              onTap: () => setState(() {
                                _day = d;
                                _range = 'day';
                              }),
                              borderRadius: BorderRadius.circular(15),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      DateFormat('EEE', 'ar').format(d),
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: selected
                                            ? Colors.white
                                            : context.secondaryInk,
                                      ),
                                    ),
                                    const SizedBox(height: 5),
                                    Text(
                                      DateFormat('d', 'ar').format(d),
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: selected
                                            ? Colors.white
                                            : context.ink,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 5),
                  child: TextField(
                    controller: _search,
                    onChanged: (v) => setState(() => _query = v),
                    decoration: InputDecoration(
                      hintText: 'ابحث بالاسم أو الهاتف أو رقم الحجز',
                      prefixIcon: const Icon(Icons.search, size: 19),
                      suffixIcon: _query.isNotEmpty
                          ? IconButton(
                              onPressed: () {
                                _search.clear();
                                setState(() => _query = '');
                              },
                              icon: const Icon(Icons.close, size: 18),
                            )
                          : null,
                    ),
                  ),
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Row(
                    children: [
                      _chip('اليوم المحدد', 'day', true),
                      _chip('كل التواريخ', 'all', true),
                      _chip('القادمة', 'upcoming', true),
                      _chip('السابقة', 'past', true),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SliverPersistentHeader(
            pinned: true,
            delegate: _StatusHeader(
              color: context.canvas,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                child: Row(
                  children: [
                    _chip('الكل', 'all', false),
                    _chip('انتظار', 'pending', false),
                    _chip('مؤكد', 'confirmed', false),
                    _chip('تم الكشف', 'completed', false),
                    _chip('ملغي', 'cancelled', false),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  '${list.length} مواعيد · ${list.where((a) => a.status == 'pending').length} تحتاج تأكيد',
                  style: TextStyle(fontSize: 11, color: context.secondaryInk),
                ),
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, i) {
                  if (list.isEmpty)
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      child: Column(
                        children: [
                          Icon(
                            Icons.event_available_outlined,
                            color: context.secondaryInk,
                            size: 40,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'لا توجد حجوزات مطابقة',
                            style: TextStyle(color: context.secondaryInk),
                          ),
                        ],
                      ),
                    );
                  final a = list[i];
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 47,
                        child: Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Text(
                            clinicTime(a.appointmentTime),
                            textDirection: TextDirection.ltr,
                            style: TextStyle(
                              fontSize: 10,
                              color: context.secondaryInk,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: BookingCard(
                          appointment: a,
                          onStatusChange: (s) => _statusChange(a, s),
                          onDelete: () => _delete(a),
                        ),
                      ),
                    ],
                  );
                }, childCount: list.isEmpty ? 1 : list.length),
              ),
            ),
        ],
      ),
    );
  }

  Widget _chip(String label, String value, bool range) {
    final selected = (range ? _range : _status) == value;
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 7),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: selected ? Colors.white : context.secondaryInk,
          ),
        ),
        selected: selected,
        showCheckmark: false,
        selectedColor: AppColors.royal,
        backgroundColor: context.panel,
        side: BorderSide.none,
        onSelected: (_) => setState(() {
          if (range) {
            _range = value;
          } else {
            _status = value;
          }
        }),
      ),
    );
  }
}

class _StatusHeader extends SliverPersistentHeaderDelegate {
  final Widget child;
  final Color color;
  _StatusHeader({required this.child, required this.color});
  @override
  double get minExtent => 52;
  @override
  double get maxExtent => 52;
  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) => SizedBox.expand(
    child: Material(color: color, child: child),
  );
  @override
  bool shouldRebuild(covariant _StatusHeader old) => true;
}
