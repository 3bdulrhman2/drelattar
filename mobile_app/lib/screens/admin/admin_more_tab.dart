import 'package:flutter/material.dart';
import '../../models/secretary_account.dart';
import '../../services/auth_service.dart';
import '../../services/notification_service.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';

class AdminMoreTab extends StatefulWidget {
  const AdminMoreTab({super.key});

  @override
  State<AdminMoreTab> createState() => _AdminMoreTabState();
}

class _AdminMoreTabState extends State<AdminMoreTab> {
  List<SecretaryAccount> _secretaries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _secretaries = SupabaseService.cachedSecretaries;
    _isLoading = _secretaries.isEmpty;
    _loadSecretaries();
  }

  Future<void> _loadSecretaries({bool forceRefresh = false}) async {
    if (_secretaries.isEmpty) {
      setState(() => _isLoading = true);
    }
    final list = await SupabaseService.getSecretaryAccounts(forceRefresh: forceRefresh);
    if (!mounted) return;
    setState(() {
      _secretaries = list;
      _isLoading = false;
    });
  }

  void _showAddSecretaryDialog() {
    final nameController = TextEditingController();
    final userController = TextEditingController();
    final passController = TextEditingController();
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('إضافة مشرف / سكرتير جديد', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('اسم المشرف الكامل:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(hintText: 'مثال: أ / سارة أحمد'),
              ),
              const SizedBox(height: 10),
              const Text('اسم المستخدم (Username):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: userController,
                decoration: const InputDecoration(hintText: 'sara_sec'),
              ),
              const SizedBox(height: 10),
              const Text('كلمة المرور:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: passController,
                decoration: const InputDecoration(hintText: '••••••••'),
              ),
              const SizedBox(height: 10),
              const Text('رقم الهاتف (اختياري):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(hintText: '010XXXXXXXX'),
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
              if (nameController.text.trim().isEmpty ||
                  userController.text.trim().isEmpty ||
                  passController.text.trim().isEmpty) {
                return;
              }
              final account = SecretaryAccount(
                id: 'sec-${DateTime.now().millisecondsSinceEpoch}',
                username: userController.text.trim().toLowerCase(),
                passwordHash: passController.text.trim(),
                name: nameController.text.trim(),
                phone: phoneController.text.trim().isEmpty ? null : phoneController.text.trim(),
                createdAt: DateTime.now().toIso8601String(),
              );

              if (ctx.mounted) Navigator.pop(ctx);

              // Optimistic UI update
              setState(() {
                _secretaries.insert(0, account);
              });

              await SupabaseService.addSecretaryAccount(account);
              _loadSecretaries();
            },
            child: const Text('حفظ المشرف'),
          ),
        ],
      ),
    );
  }

  void _showResetPasswordDialog(SecretaryAccount account) {
    final newPassController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('تغيير كلمة مرور ${account.name}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('كلمة المرور الجديدة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            TextField(
              controller: newPassController,
              decoration: const InputDecoration(hintText: 'اكتب كلمة المرور الجديدة...'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () async {
              if (newPassController.text.trim().isEmpty) return;
              if (ctx.mounted) Navigator.pop(ctx);

              await SupabaseService.updateSecretaryAccount(account.id, {
                'passwordHash': newPassController.text.trim(),
              });
              _loadSecretaries();
            },
            child: const Text('تحديث'),
          ),
        ],
      ),
    );
  }

  void _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تأكيد تسجيل الخروج'),
        content: const Text('هل ترغب في تسجيل الخروج من لوحة إدارة العيادة؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('تسجيل خروج'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await AuthService.logout();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _loadSecretaries(forceRefresh: true),
      color: AppColors.royal,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Doctor Profile Card with Real Photo
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.royal.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Official Doctor Portrait
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.royal.withValues(alpha: 0.2), width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.royal.withValues(alpha: 0.12),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.asset(
                        'assets/images/doctor_photo.jpg',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: AppColors.royal.withValues(alpha: 0.1),
                          child: const Icon(Icons.person, color: AppColors.royal, size: 36),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'د. محمد السيد العطار',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.dark),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.royal.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'المدير الطبي',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.royal),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        const Text(
                          'أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة',
                          style: TextStyle(fontSize: 11, color: AppColors.muted),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: const [
                            Icon(Icons.location_on_outlined, size: 12, color: AppColors.medical),
                            SizedBox(width: 4),
                            Text(
                              'فاقوس - الشرقية | elattar.site',
                              style: TextStyle(fontSize: 10, color: AppColors.dark, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Secretary Accounts Management Section
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
                      Text(
                        'مشرفي وسكرتارية الحجوزات (${_secretaries.length})',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark),
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddSecretaryDialog,
                        icon: const Icon(Icons.person_add, size: 16),
                        label: const Text('إضافة سكرتير', style: TextStyle(fontSize: 11)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'يمكنك إنشاء حسابات للسكرتارية لإدارة الحجوزات وتنظيم المواعيد فقط دون صلاحيات تعديل الموقع.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 12),

                  if (_isLoading && _secretaries.isEmpty)
                    const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(color: AppColors.royal)))
                  else if (_secretaries.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: const [
                          Icon(Icons.people_outline, size: 36, color: AppColors.muted),
                          SizedBox(height: 6),
                          Text(
                            'لم تتم إضافة حسابات سكرتارية بعد',
                            style: TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w600),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'اضغط زر "إضافة سكرتير" بالأعلى لإنشاء حساب جديد',
                            style: TextStyle(fontSize: 10, color: AppColors.muted),
                          ),
                        ],
                      ),
                    )
                  else
                    ..._secretaries.map((sec) => Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: sec.isActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  sec.isActive ? Icons.person : Icons.person_off,
                                  color: sec.isActive ? const Color(0xFF047857) : Colors.red.shade700,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      sec.name,
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.dark),
                                    ),
                                    Text(
                                      'المستخدم: ${sec.username} | ${sec.phone ?? "بدون هاتف"}',
                                      style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                    ),
                                  ],
                                ),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Toggle Active
                                  IconButton(
                                    icon: Icon(
                                      sec.isActive ? Icons.check_circle : Icons.cancel,
                                      color: sec.isActive ? const Color(0xFF059669) : Colors.red,
                                      size: 20,
                                    ),
                                    tooltip: sec.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب',
                                    onPressed: () async {
                                      setState(() {
                                        final idx = _secretaries.indexWhere((s) => s.id == sec.id);
                                        if (idx != -1) {
                                          _secretaries[idx] = _secretaries[idx].copyWith(isActive: !sec.isActive);
                                        }
                                      });
                                      await SupabaseService.updateSecretaryAccount(sec.id, {
                                        'isActive': !sec.isActive,
                                      });
                                      _loadSecretaries();
                                    },
                                  ),

                                  // Reset password
                                  IconButton(
                                    icon: const Icon(Icons.key, size: 20, color: AppColors.royal),
                                    tooltip: 'تغيير كلمة المرور',
                                    onPressed: () => _showResetPasswordDialog(sec),
                                  ),

                                  // Delete
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                    tooltip: 'حذف المشرف',
                                    onPressed: () async {
                                      final confirm = await showDialog<bool>(
                                        context: context,
                                        builder: (ctx) => AlertDialog(
                                          title: const Text('تأكيد حذف الحساب'),
                                          content: Text('هل أنت متأكد من حذف حساب "${sec.name}" نهائياً؟'),
                                          actions: [
                                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
                                            ElevatedButton(
                                              onPressed: () => Navigator.pop(ctx, true),
                                              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                              child: const Text('حذف'),
                                            ),
                                          ],
                                        ),
                                      );

                                      if (confirm == true) {
                                        setState(() {
                                          _secretaries.removeWhere((s) => s.id == sec.id);
                                        });
                                        await SupabaseService.deleteSecretaryAccount(sec.id);
                                        _loadSecretaries();
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Notification Testing Card
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
                  const Text('نظام التنبيهات والإشعارات الفورية', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                  const SizedBox(height: 4),
                  const Text(
                    'يتم تشغيل التنبيه الفوري بالصوت والاهتزاز عند وصول أي حجز جديد من الموقع الإلكتروني حتى لو كان الهاتف مقفلاً.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await NotificationService.testNotification();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('تم إرسال إشعار تجريبي بالصوت والاهتزاز بنجاح! 🔔')),
                          );
                        }
                      },
                      icon: const Icon(Icons.notifications_active, size: 18, color: AppColors.royal),
                      label: const Text('اختبار إرسال إشعار تجريبي للموبايل 🔔'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // App Version & Logout Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('إصدار التطبيق', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                      Text('1.0.0 (Native Edition)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.dark)),
                    ],
                  ),
                  const Divider(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _handleLogout,
                      icon: const Icon(Icons.logout, color: Colors.red, size: 18),
                      label: const Text('تسجيل الخروج من التطبيق', style: TextStyle(color: Colors.red)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.red),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
