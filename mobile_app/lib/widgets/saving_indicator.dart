import 'package:flutter/material.dart';

import '../services/supabase_service.dart';

/// Thin status strip under the app while any change is applied on screen but
/// not yet confirmed by the server. It sits in its own area below the content,
/// so it never covers anything, and disappears only after the server says yes.
class SavingIndicator extends StatelessWidget {
  final Widget child;
  const SavingIndicator({super.key, required this.child});

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<bool>(
    valueListenable: SupabaseService.savingNow,
    builder: (context, saving, _) => Column(
      children: [
        Expanded(
          child: MediaQuery.removePadding(
            context: context,
            removeBottom: saving,
            child: child,
          ),
        ),
        if (saving)
          Container(
            width: double.infinity,
            color: const Color(0xFF334155),
            padding: EdgeInsets.only(
              top: 5,
              bottom: MediaQuery.paddingOf(context).bottom + 5,
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 10,
                  height: 10,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.6,
                    color: Colors.white,
                  ),
                ),
                SizedBox(width: 6),
                Text(
                  'جارٍ الحفظ...',
                  style: TextStyle(
                    fontFamily: 'ClinicArabic',
                    color: Colors.white,
                    fontSize: 11,
                    decoration: TextDecoration.none,
                    fontWeight: FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
      ],
    ),
  );
}
