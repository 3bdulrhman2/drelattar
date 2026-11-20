import 'package:flutter/material.dart';
import '../../models/clinic_holiday.dart';
import '../../services/auth_service.dart';
import '../../services/notification_service.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';

class SecretaryAvailabilityTab extends StatefulWidget {
  const SecretaryAvailabilityTab({super.key});

  @override
  State<SecretaryAvailabilityTab> createState() => _SecretaryAvailabilityTabState();
}

class _SecretaryAvailabilityTabState extends State<SecretaryAvailabilityTab> {
  Map<String, dynamic>? _settings;
  bool _isLoading = true;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    final settings = await SupabaseService.getClinicSettings();
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
                  decoration: const InputDecoration(hintText: 'مثال: إجازة عيد الفطر / عطلة'),
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
                  createdBy: 'secretary',
                  createdAt: DateTime.now().toIso8601String(),
                );
                await SupabaseService.addHoliday(holiday);
                if (ctx.mounted) Navigator.pop(ctx);
                _loadSettings();
              },
              child: const Text('حفظ الإجازة'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.royal));
    }

    final bookingSettings = Map<String, dynamic>.from(_settings?['bookingSettings'] ?? {});
    final isClosedToday = bookingSettings['isClosedToday'] == true;
    final List<dynamic> closedDates = bookingSettings['closedDates'] ?? [];
    final List<dynamic> holidays = bookingSettings['holidays'] ?? [];

    final selectedDateStr = _formatDate(_selectedDate);
    final isDateCurrentlyClosed = closedDates.contains(selectedDateStr);

    return RefreshIndicator(
      onRefresh: _loadSettings,
      color: AppColors.royal,
      child: SingleChildScrollView(
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
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('إغلاق الحجوزات اليوم', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
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
                        ? 'الحجز مغلق حالياً لليوم بالموقع. انقر لإعادة الفتح.'
                        : 'انقر لإغلاق استقبال مواعيد جديدة لليوم مع بقاء الحجوزات السابقة مسجلة.',
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        await SupabaseService.toggleCloseToday(!isClosedToday);
                        _loadSettings();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isClosedToday ? const Color(0xFF059669) : Colors.red.shade600,
                      ),
                      child: Text(isClosedToday ? 'إعادة فتح حجوزات اليوم بالموقع' : 'إغلاق حجوزات اليوم فوراً بالموقع'),
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
                  const Text('إغلاق موعد أو يوم محدد', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                  const SizedBox(height: 4),
                  const Text('اختر يوماً لإيقاف استقبال الحجوزات فيه على الموقع:', style: TextStyle(fontSize: 11, color: AppColors.muted)),
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
                          await SupabaseService.toggleCloseDate(selectedDateStr, !isDateCurrentlyClosed);
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
                    const Text('الأيام المغلقة حالياً:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.muted)),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: closedDates.map((date) => Chip(
                        label: Text(date.toString(), style: const TextStyle(fontSize: 11)),
                        deleteIcon: const Icon(Icons.close, size: 14),
                        onDeleted: () async {
                          await SupabaseService.toggleCloseDate(date.toString(), false);
                          _loadSettings();
                        },
                      )).toList(),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 3: Holidays
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
                      const Text('جدولة عطلة رسمية', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                      IconButton(
                        onPressed: _showAddHolidayDialog,
                        icon: const Icon(Icons.add_circle, color: AppColors.royal),
                        tooltip: 'إضافة إجازة',
                      ),
                    ],
                  ),
                  if (holidays.isEmpty)
                    const Text('لا توجد إجازات مجدولة مسجلة', style: TextStyle(fontSize: 11, color: AppColors.muted))
                  else
                    ...holidays.map((h) => Container(
                          margin: const EdgeInsets.only(top: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(h['title'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  Text('${h['startDate']} إلى ${h['endDate']}', style: const TextStyle(fontSize: 10, color: AppColors.royal)),
                                ],
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                onPressed: () async {
                                  await SupabaseService.deleteHoliday(h['id']);
                                  _loadSettings();
                                },
                              ),
                            ],
                          ),
                        )),
                ],
              ),
            ),
            // Notification Settings Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.royal.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.notifications_active, color: AppColors.royal, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('إشعارات وتنبيهات الحجوزات الفورية',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            Text('تنبيه صوتي وإشعار فوري عند حجز أي مريض جديد',
                                style: TextStyle(fontSize: 11, color: AppColors.muted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'قناة الإشعارات الفورية نشطة ومتصلة بسيرفر العيادة',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            await NotificationService.testNotification();
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('تم إرسال إشعار تجريبي وتنبيه صوتي بنجاح 🔔'),
                                backgroundColor: AppColors.royal,
                              ),
                            );
                          },
                          icon: const Icon(Icons.volume_up, size: 16),
                          label: const Text('تجربة الإشعار والصوت'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.royal,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final granted = await NotificationService.requestPermission();
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(granted
                                  ? 'إذن الإشعارات مفعّل بنجاح ✓'
                                  : 'يرجى تفعيل الإذن من إعدادات الهاتف'),
                              backgroundColor: granted ? const Color(0xFF10B981) : Colors.orange,
                            ),
                          );
                        },
                        icon: const Icon(Icons.security, size: 16),
                        label: const Text('فحص الإذن'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await AuthService.logout();
                  if (!context.mounted) return;
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                },
                icon: const Icon(Icons.logout, size: 18),
                label: const Text('تسجيل الخروج من الحساب'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red.shade600,
                  side: BorderSide(color: Colors.red.shade200),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
