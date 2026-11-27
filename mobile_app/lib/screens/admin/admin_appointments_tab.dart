import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'admin_holidays_tab.dart';
import 'admin_website_tab.dart';

/// المواعيد: website booking schedule and holidays/closures in one tab.
class AdminAppointmentsTab extends StatelessWidget {
  const AdminAppointmentsTab({super.key});
  @override
  Widget build(BuildContext context) => DefaultTabController(
    length: 2,
    child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 4, 18, 0),
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: Text(
              'المواعيد',
              style: TextStyle(
                fontSize: 23,
                fontWeight: FontWeight.bold,
                color: context.ink,
              ),
            ),
          ),
        ),
        TabBar(
          labelColor: context.accent,
          unselectedLabelColor: context.secondaryInk,
          indicatorColor: context.accent,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'مواعيد الموقع'),
            Tab(text: 'الإجازات'),
          ],
        ),
        Expanded(
          child: TabBarView(
            children: [
              AdminWebsiteTab(section: 'schedule'),
              AdminHolidaysTab(),
            ],
          ),
        ),
      ],
    ),
  );
}
