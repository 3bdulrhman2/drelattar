import 'package:flutter/material.dart';

import '../services/supabase_service.dart';

/// Small "saving" pill shown while any change is applied on screen but not yet
/// confirmed by the server. It disappears only after the server says yes.
class SavingIndicator extends StatelessWidget {
  final Widget child;
  const SavingIndicator({super.key, required this.child});

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      child,
      PositionedDirectional(
        top: MediaQuery.paddingOf(context).top + 6,
        start: 12,
        child: IgnorePointer(
          child: ValueListenableBuilder<bool>(
            valueListenable: SupabaseService.savingNow,
            builder: (context, saving, _) => Visibility(
              visible: saving,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xE6334155),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
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
            ),
          ),
        ),
      ),
    ],
  );
}
