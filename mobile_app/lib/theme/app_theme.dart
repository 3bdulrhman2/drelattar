import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Appearance {
  static final mode = ValueNotifier<ThemeMode>(ThemeMode.light);
  static Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    mode.value = p.getBool('clinic_dark_mode') == true
        ? ThemeMode.dark
        : ThemeMode.light;
  }

  static Future<void> toggle() async {
    mode.value = mode.value == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
    final p = await SharedPreferences.getInstance();
    await p.setBool('clinic_dark_mode', mode.value == ThemeMode.dark);
  }
}

class AppColors {
  static const royal = Color(0xFF123E91);
  static const royalDark = Color(0xFF0B2963);
  static const medical = Color(0xFF087DBA);
  static const cyan = Color(0xFF16B7D8);
  static const lime = Color(0xFFC4D51D);
  static const background = Color(0xFFF3F6FB);
  static const card = Colors.white;
  static const dark = Color(0xFF172B43);
  static const darker = Color(0xFF0F1D2D);
  static const muted = Color(0xFF627D98);
  static const border = Color(0xFFE2E8F0);
  static const statusPending = Color(0xFFF59E0B);
  static const statusConfirmed = Color(0xFF2563EB);
  static const statusCompleted = Color(0xFF10B981);
  static const statusCancelled = Color(0xFFEF4444);
}

extension ClinicPalette on BuildContext {
  bool get night => Theme.of(this).brightness == Brightness.dark;
  Color get panel => Theme.of(this).colorScheme.surface;
  Color get ink => Theme.of(this).colorScheme.onSurface;
  Color get secondaryInk => night ? const Color(0xFF9BB1C7) : AppColors.muted;
  Color get canvas => Theme.of(this).scaffoldBackgroundColor;
  Color get rule => night ? const Color(0xFF28425C) : AppColors.border;
  Color get accent => night ? const Color(0xFF61D2ED) : AppColors.royal;
}

class AppTheme {
  static ThemeData get lightTheme => build(false);
  static ThemeData get darkTheme => build(true);
  static ThemeData build(bool dark) {
    final surface = dark ? const Color(0xFF192E44) : Colors.white;
    final ink = dark ? const Color(0xFFEAF0F8) : AppColors.dark;
    final accent = dark ? const Color(0xFF61D2ED) : AppColors.royal;
    final rule = dark ? const Color(0xFF28425C) : AppColors.border;
    return ThemeData(
      useMaterial3: true,
      brightness: dark ? Brightness.dark : Brightness.light,
      fontFamily: 'ClinicArabic',
      scaffoldBackgroundColor: dark ? AppColors.darker : AppColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.royal,
        brightness: dark ? Brightness.dark : Brightness.light,
        primary: accent,
        secondary: AppColors.cyan,
        surface: surface,
        onSurface: ink,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: dark ? AppColors.darker : AppColors.background,
        foregroundColor: ink,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      dividerColor: rule,
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: dark ? const Color(0xFF0C1927) : Colors.white,
        selectedItemColor: accent,
        unselectedItemColor: dark ? const Color(0xFF819BB2) : AppColors.muted,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: dark ? const Color(0xFF2A668A) : AppColors.royal,
          foregroundColor: Colors.white,
          minimumSize: const Size(44, 44),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: rule),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: rule),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: accent),
        ),
        hintStyle: TextStyle(
          fontSize: 12,
          color: dark ? const Color(0xFF9BB1C7) : AppColors.muted,
        ),
      ),
    );
  }
}
