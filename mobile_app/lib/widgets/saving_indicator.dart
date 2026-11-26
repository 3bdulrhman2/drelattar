import 'package:flutter/material.dart';

/// The saving strip was removed: changes show instantly (optimistic UI) and
/// save in the background. Failures roll back with a quiet in-app message.
class SavingIndicator extends StatelessWidget {
  final Widget child;
  const SavingIndicator({super.key, required this.child});

  @override
  Widget build(BuildContext context) => child;
}
