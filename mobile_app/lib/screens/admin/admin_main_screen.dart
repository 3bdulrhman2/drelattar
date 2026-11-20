import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'admin_home_tab.dart';
import 'admin_bookings_tab.dart';
import 'admin_holidays_tab.dart';
import 'admin_website_tab.dart';
import 'admin_more_tab.dart';

class AdminMainScreen extends StatefulWidget {
  const AdminMainScreen({super.key});

  @override
  State<AdminMainScreen> createState() => _AdminMainScreenState();
}

class _AdminMainScreenState extends State<AdminMainScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      AdminHomeTab(onNavigateToBookings: () => setState(() => _currentIndex = 1)),
      const AdminBookingsTab(),
      const AdminHolidaysTab(),
      const AdminWebsiteTab(),
      const AdminMoreTab(),
    ];
  }

  String get _appBarTitle {
    switch (_currentIndex) {
      case 0:
        return 'لوحة إدارة العيادة';
      case 1:
        return 'إدارة حجوزات المرضى';
      case 2:
        return 'الإجازات وتنظيم المواعيد';
      case 3:
        return 'إدارة محتوى الموقع والآراء';
      case 4:
        return 'إدارة السكرتارية والمزيد';
      default:
        return 'عيادتي | My Clinic';
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
            label: 'الإجازات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.language_outlined),
            activeIcon: Icon(Icons.language),
            label: 'الموقع',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_outlined),
            activeIcon: Icon(Icons.more_horiz),
            label: 'المزيد',
          ),
        ],
      ),
    );
  }
}
