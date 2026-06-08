import 'package:local_auth/local_auth.dart';

/// Biometric confirmation gate for the money-moving "Approve & buy" action.
///
/// Degrades gracefully: if the device has no biometrics enrolled, or the
/// platform isn't configured (e.g. missing NSFaceIDUsageDescription on iOS or a
/// non-FragmentActivity host on Android), it returns `true` so the user is never
/// locked out — production builds should complete that platform setup so the
/// prompt actually appears. See README → "Biometric approval".
class Biometric {
  const Biometric._();

  static final LocalAuthentication _auth = LocalAuthentication();

  static Future<bool> confirm(String reason) async {
    try {
      final bool supported =
          await _auth.isDeviceSupported() || await _auth.canCheckBiometrics;
      if (!supported) return true;
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } catch (_) {
      return true; // never block the purchase if biometrics are unavailable
    }
  }
}
