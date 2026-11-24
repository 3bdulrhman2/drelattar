import 'package:flutter/material.dart';

import '../../models/secretary_account.dart';
import '../../services/auth_service.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../login_screen.dart';
import '../staff_push_screen.dart';

class AdminMoreTab extends StatefulWidget {
  AdminMoreTab({super.key});

  @override
  State<AdminMoreTab> createState() => _AdminMoreTabState();
}

class _AdminMoreTabState extends State<AdminMoreTab> {
  List<SecretaryAccount> _secretaries = [];
  bool _isLoading = true;
  String? _staffError;

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
    try {
      final list = await SupabaseService.getSecretaryAccounts(
        forceRefresh: forceRefresh,
      );
      if (!mounted) return;
      setState(() {
        _secretaries = list;
        _staffError = null;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _staffError =
            'تعذر تحميل حسابات الفريق. راجع اتصال الإنترنت وحاول التحديث';
      });
    }
  }

  Future<bool> _staffAction(Future<bool> Function() operation) async {
    try {
      await operation();
      await _loadSecretaries(forceRefresh: true);
      return true;
    } catch (_) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'لم يتم تأكيد العملية. راجع الاتصال وحدّث القائمة قبل المحاولة مرة أخرى.',
            ),
          ),
        );
      return false;
    }
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
        title: Text(
          'إضافة مشرف / سكرتير جديد',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'اسم المشرف الكامل:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              TextField(
                controller: nameController,
                decoration: InputDecoration(hintText: 'مثال: أ / سارة أحمد'),
              ),
              SizedBox(height: 10),
              Text(
                'البريد الإلكتروني للدخول:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              TextField(
                controller: userController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(hintText: 'name@example.com'),
              ),
              SizedBox(height: 10),
              Text(
                'كلمة المرور:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              TextField(
                controller: passController,
                obscureText: true,
                enableSuggestions: false,
                autocorrect: false,
                decoration: InputDecoration(hintText: '••••••••'),
              ),
              SizedBox(height: 10),
              Text(
                'رقم الهاتف (اختياري):',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              TextField(
                controller: phoneController,
                decoration: InputDecoration(hintText: '010XXXXXXXX'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('إلغاء')),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.trim().isEmpty ||
                  userController.text.trim().isEmpty ||
                  passController.text.trim().isEmpty) {
                return;
              }
              if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                      .hasMatch(userController.text.trim()) ||
                  passController.text.length < 8) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'اكتب بريدًا إلكترونيًا صحيحًا وكلمة مرور من ٨ أحرف على الأقل',
                    ),
                  ),
                );
                return;
              }
              final ok = await _staffAction(
                () => SupabaseService.createSecretaryAccount(
                  email: userController.text.trim(),
                  password: passController.text,
                  name: nameController.text.trim(),
                  phone: phoneController.text.trim(),
                ),
              );
              passController.clear();
              if (ok && ctx.mounted) Navigator.pop(ctx);
            },
            child: Text('حفظ المشرف'),
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
        title: Text(
          'تغيير كلمة مرور ${account.name}',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'كلمة المرور الجديدة:',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 6),
            TextField(
              controller: newPassController,
              obscureText: true,
              enableSuggestions: false,
              autocorrect: false,
              decoration: InputDecoration(
                hintText: 'اكتب كلمة المرور الجديدة...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('إلغاء')),
          ElevatedButton(
            onPressed: () async {
              if (newPassController.text.length < 8) return;
              final ok = await _staffAction(
                () => SupabaseService.updateSecretaryAccount(account.id, {
                  'password': newPassController.text,
                }),
              );
              newPassController.clear();
              if (ok && ctx.mounted) Navigator.pop(ctx);
            },
            child: Text('تحديث'),
          ),
        ],
      ),
    );
  }

  void _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('تأكيد تسجيل الخروج'),
        content: Text('هل ترغب في تسجيل الخروج من لوحة إدارة العيادة؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: Text('تسجيل خروج'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await AuthService.logout();
      } catch (_) {
        if (mounted)
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'تعذر إيقاف إشعارات الجهاز. اتصل بالإنترنت وحاول تسجيل الخروج مرة أخرى',
              ),
            ),
          );
        return;
      }
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => LoginScreen()),
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
        physics: AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Doctor Profile Card with Real Photo
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.royal.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: Offset(0, 4),
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
                      border: Border.all(
                        color: AppColors.royal.withValues(alpha: 0.2),
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.royal.withValues(alpha: 0.12),
                          blurRadius: 10,
                          offset: Offset(0, 4),
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
                          child: Icon(
                            Icons.person,
                            color: AppColors.royal,
                            size: 36,
                          ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            Text(
                              'د. محمد السيد العطار',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: context.ink,
                              ),
                            ),
                            SizedBox(width: 6),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.royal.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'المدير الطبي',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.royal,
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 3),
                        Text(
                          'أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة',
                          style: TextStyle(
                            fontSize: 11,
                            color: context.secondaryInk,
                          ),
                        ),
                        SizedBox(height: 4),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),

            if (_staffError != null)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  _staffError!,
                  style: const TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
            // Secretary Accounts Management Section
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Text(
                        'مشرفي وسكرتارية الحجوزات (${_secretaries.length})',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddSecretaryDialog,
                        icon: Icon(Icons.person_add, size: 16),
                        label: Text(
                          'إضافة سكرتير',
                          style: TextStyle(fontSize: 11),
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Text(
                    'يمكنك إنشاء حسابات للسكرتارية لإدارة الحجوزات وتنظيم المواعيد فقط دون صلاحيات تعديل الموقع.',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 12),

                  if (_isLoading && _secretaries.isEmpty)
                    Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(
                          color: AppColors.royal,
                        ),
                      ),
                    )
                  else if (_secretaries.isEmpty)
                    Container(
                      padding: EdgeInsets.all(16),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: context.canvas,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.people_outline,
                            size: 36,
                            color: context.secondaryInk,
                          ),
                          SizedBox(height: 6),
                          Text(
                            _staffError == null
                                ? 'لم تتم إضافة حسابات سكرتارية بعد'
                                : 'تعذر تحميل حسابات السكرتارية',
                            style: TextStyle(
                              fontSize: 12,
                              color: context.secondaryInk,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            _staffError == null
                                ? 'اضغط زر "إضافة سكرتير" بالأعلى لإنشاء حساب جديد'
                                : 'تعذر الاتصال بخدمة حسابات الفريق',
                            style: TextStyle(
                              fontSize: 10,
                              color: context.secondaryInk,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ..._secretaries.map(
                      (sec) => Container(
                        margin: EdgeInsets.only(bottom: 10),
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: context.canvas,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.rule),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: sec.isActive
                                    ? Color(0xFFDCFCE7)
                                    : Color(0xFFFEE2E2),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                sec.isActive ? Icons.person : Icons.person_off,
                                color: sec.isActive
                                    ? Color(0xFF047857)
                                    : Colors.red.shade700,
                                size: 20,
                              ),
                            ),
                            SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    sec.name,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: context.ink,
                                    ),
                                  ),
                                  Text(
                                    'المستخدم: ${sec.username} | ${sec.phone ?? "بدون هاتف"}',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: context.secondaryInk,
                                    ),
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
                                    sec.isActive
                                        ? Icons.check_circle
                                        : Icons.cancel,
                                    color: sec.isActive
                                        ? Color(0xFF059669)
                                        : Colors.red,
                                    size: 20,
                                  ),
                                  tooltip: sec.isActive
                                      ? 'تعطيل الحساب'
                                      : 'تفعيل الحساب',
                                  onPressed: () async {
                                    await _staffAction(
                                      () =>
                                          SupabaseService.updateSecretaryAccount(
                                            sec.id,
                                            {'isActive': !sec.isActive},
                                          ),
                                    );
                                  },
                                ),

                                // Reset password
                                IconButton(
                                  icon: Icon(
                                    Icons.key,
                                    size: 20,
                                    color: AppColors.royal,
                                  ),
                                  tooltip: 'تغيير كلمة المرور',
                                  onPressed: () =>
                                      _showResetPasswordDialog(sec),
                                ),

                                // Delete
                                IconButton(
                                  icon: Icon(
                                    Icons.delete_outline,
                                    size: 20,
                                    color: Colors.red,
                                  ),
                                  tooltip: 'حذف المشرف',
                                  onPressed: () async {
                                    final confirm = await showDialog<bool>(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: Text('تأكيد حذف الحساب'),
                                        content: Text(
                                          'هل أنت متأكد من حذف حساب "${sec.name}" نهائياً؟',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(ctx, false),
                                            child: Text('إلغاء'),
                                          ),
                                          ElevatedButton(
                                            onPressed: () =>
                                                Navigator.pop(ctx, true),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.red,
                                            ),
                                            child: Text('حذف'),
                                          ),
                                        ],
                                      ),
                                    );

                                    if (confirm == true) {
                                      await _staffAction(
                                        () =>
                                            SupabaseService.deleteSecretaryAccount(
                                              sec.id,
                                            ),
                                      );
                                    }
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            SizedBox(height: 20),

            // Notification Testing Card
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'نظام التنبيهات والإشعارات الفورية',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'إشعارات يدوية للدكتور والسكرتارية، منفصلة عن إعلان الموقع',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const StaffPushScreen(),
                        ),
                      ),
                      icon: Icon(
                        Icons.notifications_active,
                        size: 18,
                        color: AppColors.royal,
                      ),
                      label: Text('إعدادات إشعارات الفريق'),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),

            // App Version & Logout Card
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'إصدار التطبيق',
                        style: TextStyle(
                          fontSize: 12,
                          color: context.secondaryInk,
                        ),
                      ),
                      Text(
                        '1.1.4 (Native Edition)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                    ],
                  ),
                  Divider(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _handleLogout,
                      icon: Icon(Icons.logout, color: Colors.red, size: 18),
                      label: Text(
                        'تسجيل الخروج من التطبيق',
                        style: TextStyle(color: Colors.red),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: Colors.red),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
