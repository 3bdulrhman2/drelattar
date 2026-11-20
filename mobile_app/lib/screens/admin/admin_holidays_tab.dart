import 'package:flutter/material.dart';
import '../../models/clinic_holiday.dart';
import '../../models/clinic_announcement.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';

class AdminHolidaysTab extends StatefulWidget {
  const AdminHolidaysTab({super.key});

  @override
  State<AdminHolidaysTab> createState() => _AdminHolidaysTabState();
}

class _AdminHolidaysTabState extends State<AdminHolidaysTab> {
  Map<String, dynamic>? _settings;
  bool _isLoading = true;

  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _settings = SupabaseService.cachedSettings;
    _isLoading = _settings == null;
    _loadSettings();
  }

  Future<void> _loadSettings({bool forceRefresh = false}) async {
    if (_settings == null) {
      setState(() => _isLoading = true);
    }
    final settings = await SupabaseService.getClinicSettings(forceRefresh: forceRefresh);
    if (!mounted) return;
    setState(() {
      _settings = settings;
      _isLoading = false;
    });
  }

  String _formatDate(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  void _showAddHolidayDialog() {
    final titleController = TextEditingController();
    final reasonController = TextEditingController();
    DateTime start = DateTime.now();
    DateTime end = DateTime.now();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('جدولة إجازة أو عطلة جديدة', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('عنوان الإجازة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(hintText: 'مثال: إجازة عيد الفطر / عطلة سنوية'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('من:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          TextButton(
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: start,
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (picked != null) setDialogState(() => start = picked);
                            },
                            child: Text(_formatDate(start), style: const TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('إلى:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          TextButton(
                            onPressed: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: end,
                                firstDate: start,
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (picked != null) setDialogState(() => end = picked);
                            },
                            child: Text(_formatDate(end), style: const TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('رسالة للمرضى (اختياري):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(hintText: 'نعتذر عن استقبال الكشوفات للإجازة...'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (titleController.text.trim().isEmpty) return;
                final holiday = ClinicHoliday(
                  id: 'hol-${DateTime.now().millisecondsSinceEpoch}',
                  title: titleController.text.trim(),
                  startDate: _formatDate(start),
                  endDate: _formatDate(end),
                  reason: reasonController.text.trim().isEmpty ? null : reasonController.text.trim(),
                  createdAt: DateTime.now().toIso8601String(),
                );
                if (ctx.mounted) Navigator.pop(ctx);
                
                // Optimistic UI update
                setState(() {
                  final bSettings = Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
                  final currentHols = List<dynamic>.from(bSettings['holidays'] ?? []);
                  currentHols.insert(0, holiday.toJson());
                  bSettings['holidays'] = currentHols;
                  _settings?['bookingSettings'] = bSettings;
                });
                
                await SupabaseService.addHoliday(holiday);
                _loadSettings();
              },
              child: const Text('حفظ الإجازة'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAnnouncementDialog() {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    String type = 'info';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('نشر تنبيه أو إعلان للمرضى', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('عنوان التنبيه:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(hintText: 'مثال: تنويه بخصوص مواعيد العمل'),
                ),
                const SizedBox(height: 12),
                const Text('نوع الإعلان ولونه:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                DropdownButton<String>(
                  value: type,
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: 'info', child: Text('إخباري (أزرق ملكي)')),
                    DropdownMenuItem(value: 'warning', child: Text('تنبيه هام (أصفر/برتقالي)')),
                    DropdownMenuItem(value: 'alert', child: Text('عاجل / إغلاق طارئ (أحمر)')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => type = val);
                  },
                ),
                const SizedBox(height: 12),
                const Text('محتوى التنبيه:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: contentController,
                  maxLines: 3,
                  decoration: const InputDecoration(hintText: 'اكتب نص التنبيه الذي سيظهر لزوار الموقع...'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (titleController.text.trim().isEmpty || contentController.text.trim().isEmpty) return;
                final announcement = ClinicAnnouncement(
                  id: 'ann-${DateTime.now().millisecondsSinceEpoch}',
                  title: titleController.text.trim(),
                  content: contentController.text.trim(),
                  type: type,
                  createdAt: DateTime.now().toIso8601String(),
                );
                if (ctx.mounted) Navigator.pop(ctx);
                
                // Optimistic UI update
                setState(() {
                  final bSettings = Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
                  final currentAnns = List<dynamic>.from(bSettings['announcements'] ?? []);
                  currentAnns.insert(0, announcement.toJson());
                  bSettings['announcements'] = currentAnns;
                  _settings?['bookingSettings'] = bSettings;
                });

                await SupabaseService.addAnnouncement(announcement);
                _loadSettings();
              },
              child: const Text('نشر الإعلان'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _settings == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.royal));
    }

    final bookingSettings = Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
    final isClosedToday = bookingSettings['isClosedToday'] == true;
    final List<dynamic> closedDates = List.from(bookingSettings['closedDates'] ?? []);
    final List<dynamic> holidays = List.from(bookingSettings['holidays'] ?? []);
    final List<dynamic> announcements = List.from(bookingSettings['announcements'] ?? []);

    final selectedDateStr = _formatDate(_selectedDate);
    final isDateCurrentlyClosed = closedDates.contains(selectedDateStr);

    return RefreshIndicator(
      onRefresh: () => _loadSettings(forceRefresh: true),
      color: AppColors.royal,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card 1: Today's Closure
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isClosedToday ? Colors.red.shade200 : AppColors.border,
                  width: isClosedToday ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: (isClosedToday ? Colors.red : AppColors.royal).withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'إغلاق الحجوزات اليوم فوراً',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isClosedToday ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          isClosedToday ? 'مغلق اليوم' : 'مفتوح',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isClosedToday ? Colors.red.shade700 : const Color(0xFF047857),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isClosedToday
                        ? 'المرضى لا يستطيعون حجز مواعيد جديدة لليوم من الموقع.'
                        : 'المرضى يمكنهم حجز المواعيد المتاحة لليوم بشكل طبيعي.',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final newClosed = !isClosedToday;
                        // Instant optimistic state change
                        setState(() {
                          bookingSettings['isClosedToday'] = newClosed;
                          _settings?['bookingSettings'] = bookingSettings;
                        });
                        await SupabaseService.toggleCloseToday(newClosed);
                        _loadSettings();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isClosedToday ? const Color(0xFF059669) : Colors.red.shade600,
                      ),
                      child: Text(
                        isClosedToday ? 'إعادة فتح حجوزات اليوم بالموقع' : 'إغلاق حجوزات اليوم فوراً بالموقع',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 2: Close Specific Future Date
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('إغلاق يوم محدد مستقبلاً', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                  const SizedBox(height: 4),
                  const Text('اختر تاريخاً لإيقاف حجز المواعيد فيه تلقائياً بالموقع:', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate,
                              firstDate: DateTime.now(),
                              lastDate: DateTime.now().add(const Duration(days: 365)),
                            );
                            if (picked != null) setState(() => _selectedDate = picked);
                          },
                          icon: const Icon(Icons.calendar_today, size: 16),
                          label: Text(selectedDateStr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: () async {
                          final newStatus = !isDateCurrentlyClosed;
                          // Optimistic update
                          setState(() {
                            if (newStatus) {
                              if (!closedDates.contains(selectedDateStr)) closedDates.add(selectedDateStr);
                            } else {
                              closedDates.remove(selectedDateStr);
                            }
                            bookingSettings['closedDates'] = closedDates;
                            _settings?['bookingSettings'] = bookingSettings;
                          });
                          await SupabaseService.toggleCloseDate(selectedDateStr, newStatus);
                          _loadSettings();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isDateCurrentlyClosed ? const Color(0xFF059669) : Colors.red.shade600,
                        ),
                        child: Text(isDateCurrentlyClosed ? 'إعادة فتح' : 'إغلاق اليوم'),
                      ),
                    ],
                  ),
                  if (closedDates.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Text('الأيام المغلقة يدوياً:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.dark)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: closedDates.map((d) {
                        return Chip(
                          label: Text(d.toString(), style: const TextStyle(fontSize: 11)),
                          deleteIcon: const Icon(Icons.close, size: 14),
                          onDeleted: () async {
                            setState(() {
                              closedDates.remove(d);
                              bookingSettings['closedDates'] = closedDates;
                              _settings?['bookingSettings'] = bookingSettings;
                            });
                            await SupabaseService.toggleCloseDate(d.toString(), false);
                            _loadSettings();
                          },
                          backgroundColor: Colors.red.shade50,
                          labelStyle: TextStyle(color: Colors.red.shade800),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 3: Scheduled Holidays
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('الإجازات المجدولة (${holidays.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                      IconButton(
                        onPressed: _showAddHolidayDialog,
                        icon: const Icon(Icons.add_circle, color: AppColors.royal),
                        tooltip: 'إضافة إجازة',
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('الفترات التي تكون العيادة مغلقة فيها رسمياً.', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(height: 10),

                  if (holidays.isEmpty)
                    const Text('لا توجد إجازات مجدولة حالياً', style: TextStyle(fontSize: 11, color: AppColors.muted))
                  else
                    ...holidays.map((h) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(Icons.beach_access, size: 18, color: Colors.orange.shade700),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      h['title'] ?? 'إجازة',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.dark),
                                    ),
                                    Text(
                                      'من ${h['startDate']} إلى ${h['endDate']}',
                                      style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                    ),
                                    if (h['reason'] != null && (h['reason'] as String).isNotEmpty)
                                      Text(
                                        h['reason'],
                                        style: const TextStyle(fontSize: 10, color: AppColors.medical),
                                      ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                onPressed: () async {
                                  final hid = h['id'];
                                  setState(() {
                                    holidays.removeWhere((item) => item['id'] == hid);
                                    bookingSettings['holidays'] = holidays;
                                    _settings?['bookingSettings'] = bookingSettings;
                                  });
                                  await SupabaseService.deleteHoliday(hid);
                                  _loadSettings();
                                },
                              ),
                            ],
                          ),
                        )),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 4: Public Announcements
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('تنبيهات وإعلانات الموقع (${announcements.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                      IconButton(
                        onPressed: _showAddAnnouncementDialog,
                        icon: const Icon(Icons.add_circle, color: AppColors.royal),
                        tooltip: 'إضافة تنبيه',
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('رسائل تظهر في شريط إعلاني أعلى الموقع لجميع الزوار.', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(height: 10),

                  if (announcements.isEmpty)
                    const Text('لا توجد إعلانات نشطة حالياً', style: TextStyle(fontSize: 11, color: AppColors.muted))
                  else
                    ...announcements.map((a) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppColors.royal.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.campaign, size: 18, color: AppColors.royal),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      a['title'] ?? 'تنبيه',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.dark),
                                    ),
                                    Text(
                                      a['content'] ?? '',
                                      style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                onPressed: () async {
                                  final aid = a['id'];
                                  setState(() {
                                    announcements.removeWhere((item) => item['id'] == aid);
                                    bookingSettings['announcements'] = announcements;
                                    _settings?['bookingSettings'] = bookingSettings;
                                  });
                                  await SupabaseService.deleteAnnouncement(aid);
                                  _loadSettings();
                                },
                              ),
                            ],
                          ),
                        )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
