import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'secretary_home_tab.dart';
import 'secretary_bookings_tab.dart';
import '../staff_push_screen.dart';
import '../reception_tab.dart';
import '../../services/auth_service.dart';
import '../login_screen.dart';

class SecretaryMainScreen extends StatefulWidget {
  const SecretaryMainScreen({super.key});

  @override
  State<SecretaryMainScreen> createState() => _SecretaryMainScreenState();
}

class _SecretaryMainScreenState extends State<SecretaryMainScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      SecretaryHomeTab(
        onNavigateToBookings: () => setState(() => _currentIndex = 1),
      ),
      const SecretaryBookingsTab(),
      const ReceptionTab(),
    ];
  }

  String get _appBarTitle {
    switch (_currentIndex) {
      case 0:
        return 'لوحة مشرف الحجوزات';
      case 1:
        return 'إدارة حجوزات العيادة';
      default:
        return 'مشرف الحجوزات';
    }
  }

  Future<void> _logout() async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد تسجيل الخروج من حساب السكرتير؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    );
    if (yes != true) return;
    try {
      await AuthService.logout();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    } catch (_) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تعذر إيقاف إشعارات الجهاز. اتصل بالإنترنت وحاول الخروج مرة أخرى',
            ),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 76,
        titleSpacing: 18,
        title: Row(
          children: [
            Image.asset('assets/images/clinic_logo.png', width: 44, height: 44),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'عيادة د. محمد السيد العطار',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  Text(
                    'مشرف الحجوزات',
                    style: TextStyle(fontSize: 10, color: context.secondaryInk),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const StaffPushScreen()),
            ),
            tooltip: 'الإشعارات',
            icon: const Icon(Icons.notifications_outlined),
          ),
          IconButton(
            onPressed: _logout,
            tooltip: 'تسجيل الخروج',
            icon: const Icon(Icons.logout),
          ),
          IconButton(
            onPressed: Appearance.toggle,
            tooltip: context.night ? 'الوضع النهاري' : 'الوضع الليلي',
            icon: Icon(
              context.night
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
            ),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.royal,
        unselectedItemColor: AppColors.muted,
        selectedFontSize: 11,
        unselectedFontSize: 11,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month_outlined),
            activeIcon: Icon(Icons.calendar_month),
            label: 'الحجوزات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.how_to_reg_outlined),
            label: 'الاستقبال',
          ),
        ],
      ),
    );
  }
}
