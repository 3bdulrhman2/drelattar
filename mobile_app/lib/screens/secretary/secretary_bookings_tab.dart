import 'package:flutter/material.dart';

import '../admin/admin_bookings_tab.dart';

/// Shared agenda visuals. Permanent deletion remains a doctor-only UI action.
class SecretaryBookingsTab extends StatelessWidget {
  const SecretaryBookingsTab({super.key});
  @override
  Widget build(BuildContext context) =>
      const AdminBookingsTab(canDelete: false);
}
