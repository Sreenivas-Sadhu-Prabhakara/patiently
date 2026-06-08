import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Patiently "Noir Luxe" theme — matches the web app and docs site.
/// Near-black canvas · warm ivory ink · champagne-gold accent · light serif
/// display (Cormorant Garamond) over Inter · hairline rules.
class PatientlyTheme {
  const PatientlyTheme._();

  // ── Palette ────────────────────────────────────────────────────────────────
  static const Color bg = Color(0xFF0B0B0C);
  static const Color surface = Color(0xFF141417);
  static const Color surface2 = Color(0xFF1A1A1E);
  static const Color line = Color(0x1AEDE8E0); // ivory @ 10%
  static const Color lineStrong = Color(0x66C5A572); // gold @ 40%
  static const Color gold = Color(0xFFC5A572);
  static const Color goldBright = Color(0xFFD8BC8C);
  static const Color onGold = Color(0xFF161208);
  static const Color ink = Color(0xFFEDE8E0);
  static const Color inkDim = Color(0xFFA7A29A);
  static const Color inkFaint = Color(0xFF6F6A62);
  static const Color good = Color(0xFF9BB098);
  static const Color danger = Color(0xFFC57F6B);

  // Back-compat aliases used across the screens.
  static const Color primary = gold;
  static const Color accent = gold;
  static const Color surfaceMuted = surface;
  static const Color inkSoft = inkDim;

  // ── Type helpers ─────────────────────────────────────────────────────────────
  /// Light serif display (Cormorant Garamond).
  static TextStyle serif({
    double size = 22,
    FontWeight weight = FontWeight.w400,
    Color color = ink,
    double height = 1.2,
    FontStyle style = FontStyle.normal,
  }) {
    return GoogleFonts.cormorantGaramond(
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      fontStyle: style,
      letterSpacing: -0.2,
    );
  }

  /// Letter-spaced uppercase micro-label (use with String.toUpperCase()).
  static TextStyle label({
    double size = 10,
    Color color = inkFaint,
    double tracking = 1.8,
  }) {
    return GoogleFonts.inter(
      fontSize: size,
      fontWeight: FontWeight.w500,
      color: color,
      letterSpacing: tracking,
    );
  }

  // ── ThemeData ────────────────────────────────────────────────────────────────
  static ThemeData dark() {
    final ThemeData base = ThemeData.dark(useMaterial3: true);
    final TextTheme text = GoogleFonts.interTextTheme(
      base.textTheme,
    ).apply(bodyColor: inkDim, displayColor: ink);

    OutlinedBorder squared([double r = 3]) =>
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(r));

    return base.copyWith(
      scaffoldBackgroundColor: bg,
      colorScheme: const ColorScheme.dark(
        primary: gold,
        onPrimary: onGold,
        secondary: gold,
        onSecondary: onGold,
        surface: bg,
        onSurface: ink,
        error: danger,
      ),
      textTheme: text,
      dividerTheme: const DividerThemeData(color: line, thickness: 1, space: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: serif(size: 22, weight: FontWeight.w500),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(3),
          side: const BorderSide(color: line),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: gold,
          foregroundColor: onGold,
          disabledBackgroundColor: gold.withValues(alpha: 0.35),
          shape: squared(),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 22),
          textStyle: label(size: 11, color: onGold),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: gold,
          side: const BorderSide(color: lineStrong),
          shape: squared(),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          textStyle: label(size: 11, color: gold),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: inkFaint,
          textStyle: label(size: 11, color: inkFaint, tracking: 1.6),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: false,
        contentPadding: const EdgeInsets.symmetric(vertical: 12),
        enabledBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: line),
        ),
        focusedBorder: const UnderlineInputBorder(
          borderSide: BorderSide(color: gold),
        ),
        labelStyle: label(size: 11),
        floatingLabelStyle: label(size: 11, color: gold),
        hintStyle: GoogleFonts.inter(fontSize: 15, color: inkFaint),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.transparent,
        selectedColor: gold.withValues(alpha: 0.12),
        side: const BorderSide(color: line),
        shape: const StadiumBorder(),
        labelStyle: GoogleFonts.inter(fontSize: 12, color: inkDim),
        secondaryLabelStyle: GoogleFonts.inter(fontSize: 12, color: goldBright),
        showCheckmark: false,
      ),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
    );
  }
}
