import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'admin/admin_main_screen.dart';
import 'secretary/secretary_main_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _scaleAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _controller.forward();
    _warmUpAndCheckAuth();
  }

  Future<void> _warmUpAndCheckAuth() async {
    final results = await Future.wait([
      AuthService.loadUser(),
      SupabaseService.getClinicSettings(),
      SupabaseService.getAppointments(),
      Future.delayed(const Duration(milliseconds: 1600)),
    ]);

    if (!mounted) return;

    final user = results[0];

    if (user != null) {
      if (user.role == UserRole.admin) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const AdminMainScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) =>
                FadeTransition(opacity: animation, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      } else {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const SecretaryMainScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) =>
                FadeTransition(opacity: animation, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    } else {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) =>
              FadeTransition(opacity: animation, child: child),
          transitionDuration: const Duration(milliseconds: 400),
        ),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Premium Clinic Logo Container on White Background
                    Container(
                      width: 140,
                      height: 140,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.royal.withValues(alpha: 0.10),
                            blurRadius: 32,
                            offset: const Offset(0, 12),
                            spreadRadius: 2,
                          ),
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                        border: Border.all(
                          color: AppColors.royal.withValues(alpha: 0.08),
                          width: 1.5,
                        ),
                      ),
                      child: Image.asset(
                        'assets/images/clinic_logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(height: 28),

                    // App Title
                    const Text(
                      'عيادتي | My Clinic',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppColors.royal,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Doctor Name
                    const Text(
                      'عيادة د. محمد السيد العطار',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Specialty
                    const Text(
                      'أخصائي الباطنة العامة والعناية المركزة والحالات الحرجة',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),

                    const SizedBox(height: 44),
                    const SizedBox(
                      width: 26,
                      height: 26,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.royal),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
