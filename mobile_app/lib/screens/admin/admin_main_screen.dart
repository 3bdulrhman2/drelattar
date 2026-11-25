import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'admin_home_tab.dart';
import 'admin_bookings_tab.dart';
import 'admin_holidays_tab.dart';
import 'admin_website_tab.dart';
import 'admin_more_tab.dart';
import '../reception_tab.dart';

class AdminMainScreen extends StatefulWidget {
  const AdminMainScreen({super.key});
  @override
  State<AdminMainScreen> createState() => _AdminMainScreenState();
}

class _AdminMainScreenState extends State<AdminMainScreen> {
  int _currentIndex = 0;
  late final List<Widget> _screens = [
    AdminHomeTab(
      onNavigateToBookings: () => _go(1),
      onNavigateToWebsite: () => _go(3),
    ),
    const AdminBookingsTab(),
    AdminHolidaysTab(),
    AdminWebsiteTab(),
    AdminMoreTab(),
    const ReceptionTab(),
  ];
  void _go(int i) => setState(() => _currentIndex = i);
  @override
  Widget build(BuildContext context) => Scaffold(
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
                  'إدارة العيادة',
                  style: TextStyle(fontSize: 10, color: context.secondaryInk),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
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
      onTap: _go,
      type: BottomNavigationBarType.fixed,
      selectedFontSize: 10,
      unselectedFontSize: 10,
      selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          label: 'الرئيسية',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.calendar_month_outlined),
          label: 'الحجوزات',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.event_busy_outlined),
          label: 'الإجازات',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.language_outlined),
          label: 'الموقع',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.more_horiz), label: 'المزيد'),
        BottomNavigationBarItem(
          icon: Icon(Icons.how_to_reg_outlined),
          label: 'الاستقبال',
        ),
      ],
    ),
  );
}
