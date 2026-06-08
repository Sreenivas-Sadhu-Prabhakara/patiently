import 'package:flutter/material.dart';

/// Patiently brand theme — mirrors the web client's calm indigo + warm amber
/// palette, Material 3.
class PatientlyTheme {
  const PatientlyTheme._();

  static const Color primary = Color(0xFF6D5CFF);
  static const Color accent = Color(0xFFFFB547);
  static const Color good = Color(0xFF1F9D6B);
  static const Color danger = Color(0xFFD23F5A);
  static const Color surfaceMuted = Color(0xFFF5F4FB);
  static const Color ink = Color(0xFF1A1530);
  static const Color inkSoft = Color(0xFF5B5570);

  static ThemeData light() {
    final ColorScheme scheme = ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: accent,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: surfaceMuted,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0.5,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: Color(0xFFE7E4F2)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE7E4F2)),
        ),
      ),
    );
  }
}
