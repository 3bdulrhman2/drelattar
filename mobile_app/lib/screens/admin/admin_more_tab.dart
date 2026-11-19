import 'package:flutter/material.dart';
import '../../models/secretary_account.dart';
import '../../services/auth_service.dart';
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
    _loadSecretaries();
  }

  Future<void> _loadSecretaries() async {
    setState(() => _isLoading = true);
    final list = await SupabaseService.getSecretaryAccounts();
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
              await SupabaseService.addSecretaryAccount(account);
              if (ctx.mounted) Navigator.pop(ctx);
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
              await SupabaseService.updateSecretaryAccount(account.id, {
                'passwordHash': newPassController.text.trim(),
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _loadSecretaries();
            },
            child: const Text('تحديث'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Doctor Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppColors.royal.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.person, color: AppColors.royal, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'د. محمد السيد العطار',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.dark),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة',
                        style: TextStyle(fontSize: 11, color: AppColors.muted),
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
                    const Text(
                      'مشرفي وسكرتارية الحجوزات',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark),
                    ),
                    IconButton(
                      onPressed: _showAddSecretaryDialog,
                      icon: const Icon(Icons.person_add, color: AppColors.royal),
                      tooltip: 'إضافة سكرتير',
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'يمكنك إنشاء حسابات للسكرتارية لإدارة الحجوزات فقط دون صلاحيات تعديل الموقع.',
                  style: TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 12),

                if (_isLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(color: AppColors.royal)))
                else if (_secretaries.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(16),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text('لا توجد حسابات سكرتارية مضافة بعد', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: AppColors.muted)),
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
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(sec.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                Text('اسم المستخدم: ${sec.username}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                              ],
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.key, size: 18, color: AppColors.royal),
                                  tooltip: 'تغيير كلمة المرور',
                                  onPressed: () => _showResetPasswordDialog(sec),
                                ),
                                IconButton(
                                  icon: Icon(
                                    sec.isActive ? Icons.check_circle : Icons.pause_circle_outline,
                                    size: 18,
                                    color: sec.isActive ? const Color(0xFF10B981) : Colors.amber,
                                  ),
                                  tooltip: sec.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب',
                                  onPressed: () async {
                                    await SupabaseService.updateSecretaryAccount(sec.id, {
                                      'isActive': !sec.isActive,
                                    });
                                    _loadSecretaries();
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                  tooltip: 'حذف الحساب',
                                  onPressed: () async {
                                    await SupabaseService.deleteSecretaryAccount(sec.id);
                                    _loadSecretaries();
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
          const SizedBox(height: 24),

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
              label: const Text('تسجيل الخروج من التطبيق'),
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
    );
  }
}
