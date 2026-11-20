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
    // Ultra-snappy 320ms entrance like WhatsApp
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );

    _scaleAnimation = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    _controller.forward();
    _checkAuthAndTransition();
  }

  Future<void> _checkAuthAndTransition() async {
    // Fast parallel auth check and brief visual pause (total ~600ms)
    final results = await Future.wait([
      AuthService.loadUser(),
      Future.delayed(const Duration(milliseconds: 550)),
    ]);

    if (!mounted) return;

    final user = results[0];

    // Background silent refresh of live appointments and settings
    SupabaseService.getClinicSettings(forceRefresh: true);
    SupabaseService.getAppointments(forceRefresh: true);

    Widget targetScreen;
    if (user != null) {
      if (user.role == UserRole.admin) {
        targetScreen = const AdminMainScreen();
      } else {
        targetScreen = const SecretaryMainScreen();
      }
    } else {
      targetScreen = const LoginScreen();
    }

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => targetScreen,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(
              parent: animation,
              curve: Curves.easeInOutCubic,
            ),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
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
                    // Standalone original Clinic Logo flying directly to header via Hero tag
                    Hero(
                      tag: 'clinic_header_logo',
                      child: Material(
                        type: MaterialType.transparency,
                        child: Image.asset(
                          'assets/images/clinic_logo.png',
                          width: 140,
                          height: 140,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // App Title
                    const Text(
                      'عيادتي | My Clinic',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: AppColors.royal,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Doctor Name
                    const Text(
                      'عيادة د. محمد السيد العطار',
                      style: TextStyle(
                        fontSize: 15,
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
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
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
