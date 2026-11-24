import 'package:flutter/material.dart';

import '../admin/admin_home_tab.dart';

/// Same visual summary as doctor; no website-edit control or admin routes.
class SecretaryHomeTab extends StatelessWidget {
  final VoidCallback? onNavigateToBookings;
  const SecretaryHomeTab({super.key, this.onNavigateToBookings});
  @override
  Widget build(BuildContext context) => AdminHomeTab(
    onNavigateToBookings: onNavigateToBookings,
    canEditWebsite: false,
  );
}
