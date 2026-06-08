import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/push_service.dart';
import '../data/api_client.dart';
import '../data/auth_store.dart';
import '../data/models.dart';

/// Owns the authentication state: restores a saved session on launch, logs in,
/// and clears the session (also used as the global 401 handler).
class AuthController extends ChangeNotifier {
  AuthController(this._api, this._store);

  final ApiClient _api;
  final AuthStore _store;

  User? _user;
  bool _signedIn = false;
  bool _booting = true;
  bool _busy = false;
  String? _error;

  User? get user => _user;
  bool get signedIn => _signedIn;
  bool get booting => _booting;
  bool get busy => _busy;
  String? get error => _error;

  Future<void> restore() async {
    final String? token = await _store.readToken();
    if (token != null) {
      _api.token = token;
      _signedIn = true;
      unawaited(PushService.registerWithBackend(_api));
    }
    _booting = false;
    notifyListeners();
  }

  Future<bool> login(String email, String name) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final AuthResponse auth = await _api.login(email, name: name);
      await _store.writeToken(auth.token);
      _user = auth.user;
      _signedIn = true;
      unawaited(PushService.registerWithBackend(_api));
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _store.clear();
    _api.token = null;
    _user = null;
    _signedIn = false;
    notifyListeners();
  }
}
