import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'secretary_home_tab.dart';
import 'secretary_bookings_tab.dart';
import 'secretary_availability_tab.dart';

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
      SecretaryHomeTab(onNavigateToBookings: () => setState(() => _currentIndex = 1)),
      const SecretaryBookingsTab(),
      const SecretaryAvailabilityTab(),
    ];
  }

  String get _appBarTitle {
    switch (_currentIndex) {
      case 0:
        return 'لوحة مشرف الحجوزات';
      case 1:
        return 'إدارة حجوزات العيادة';
      case 2:
        return 'تنظيم المواعيد والإجازات';
      default:
        return 'مشرف الحجوزات';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_appBarTitle),
        actions: [
          Padding(
            padding: const EdgeInsets.only(left: 14),
            child: Hero(
              tag: 'clinic_header_logo',
              child: Material(
                type: MaterialType.transparency,
                child: Image.asset(
                  'assets/images/clinic_logo.png',
                  width: 38,
                  height: 38,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
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
            icon: Icon(Icons.event_busy_outlined),
            activeIcon: Icon(Icons.event_busy),
            label: 'تنظيم المواعيد',
          ),
        ],
      ),
    );
  }
}
