import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../data/api_client.dart';
import '../data/models.dart';

/// Wires Firebase Cloud Messaging to the backend's device registry.
///
/// Degrades gracefully: if Firebase isn't configured for this build (no
/// `flutterfire configure` / google-services files), initialization throws and
/// we simply skip push — the rest of the app is unaffected. Once configured, the
/// FCM token is registered with the backend so an `approval_needed` notification
/// arrives as a push (deep-linkable via its `wishId` / `type` data).
class PushService {
  const PushService._();

  static bool _initialized = false;

  static Future<void> registerWithBackend(ApiClient api) async {
    try {
      if (!_initialized) {
        await Firebase.initializeApp();
        _initialized = true;
      }
      final FirebaseMessaging messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();

      final String? token = await messaging.getToken();
      if (token == null) return;
      await api.registerDevice(token, _platform());

      // Keep the backend in sync when FCM rotates the token.
      messaging.onTokenRefresh.listen((t) async {
        try {
          await api.registerDevice(t, _platform());
        } catch (_) {
          /* ignore refresh failures */
        }
      });
    } catch (e) {
      debugPrint(
        '[push] disabled (Firebase not configured for this build?): $e',
      );
    }
  }

  static DevicePlatform _platform() {
    if (kIsWeb) return DevicePlatform.web;
    return defaultTargetPlatform == TargetPlatform.iOS
        ? DevicePlatform.ios
        : DevicePlatform.android;
  }
}
