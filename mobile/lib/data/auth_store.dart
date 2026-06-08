import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists the session JWT in platform-secure storage (Keychain / Keystore).
/// This is the one piece that differs from the web client (which uses
/// localStorage) — everything above it is shared in spirit with `ApiClient`.
class AuthStore {
  AuthStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  static const String _key = 'patiently.token';
  final FlutterSecureStorage _storage;

  Future<String?> readToken() => _storage.read(key: _key);
  Future<void> writeToken(String token) =>
      _storage.write(key: _key, value: token);
  Future<void> clear() => _storage.delete(key: _key);
}
