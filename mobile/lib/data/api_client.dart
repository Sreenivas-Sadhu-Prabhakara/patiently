import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config.dart';
import 'models.dart';

/// Thrown for any non-2xx API response; carries the server's error message.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

/// Thrown specifically on 401 so the auth layer can drop the session.
class UnauthorizedException extends ApiException {
  UnauthorizedException()
    : super('Your session expired — please sign in again.', statusCode: 401);
}

/// Typed client for the Patiently middleware API. Mirrors the web client's
/// `ApiClient` against the same contract.
class ApiClient {
  ApiClient({http.Client? httpClient, String? baseUrl})
    : _http = httpClient ?? http.Client(),
      _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  final http.Client _http;
  final String _baseUrl;
  String? _token;

  set token(String? value) => _token = value;
  bool get isAuthenticated => _token != null;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Uri _uri(String path) => Uri.parse('$_baseUrl$path');

  dynamic _decode(http.Response res) {
    if (res.statusCode == 401) throw UnauthorizedException();
    if (res.statusCode < 200 || res.statusCode >= 300) {
      String message = 'Request failed (${res.statusCode})';
      try {
        final dynamic body = jsonDecode(res.body);
        if (body is Map && body['error'] is String) {
          message = body['error'] as String;
        }
      } catch (_) {
        /* keep default message */
      }
      throw ApiException(message, statusCode: res.statusCode);
    }
    return res.body.isEmpty ? null : jsonDecode(res.body);
  }

  Future<AuthResponse> login(String email, {String? name}) async {
    final res = await _http.post(
      _uri('/api/auth/login'),
      headers: _headers,
      body: jsonEncode({
        'email': email,
        if (name != null && name.isNotEmpty) 'name': name,
      }),
    );
    final auth = AuthResponse.fromJson(_decode(res) as Map<String, dynamic>);
    _token = auth.token;
    return auth;
  }

  Future<List<WishView>> listWishes() async {
    final res = await _http.get(_uri('/api/wishes'), headers: _headers);
    return (_decode(res) as List<dynamic>)
        .map((e) => WishView.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createWish(CreateWishInput input) async {
    final res = await _http.post(
      _uri('/api/wishes'),
      headers: _headers,
      body: jsonEncode(input.toJson()),
    );
    _decode(res);
  }

  Future<void> searchNow(String wishId) async {
    final res = await _http.post(
      _uri('/api/wishes/$wishId/search'),
      headers: _headers,
    );
    _decode(res);
  }

  Future<void> decide(String wishId, {required bool approve}) async {
    final res = await _http.post(
      _uri('/api/wishes/$wishId/decision'),
      headers: _headers,
      body: jsonEncode({'approve': approve}),
    );
    _decode(res);
  }

  Future<void> cancelWish(String wishId) async {
    final res = await _http.delete(
      _uri('/api/wishes/$wishId'),
      headers: _headers,
    );
    _decode(res);
  }

  Future<List<Notification>> listNotifications() async {
    final res = await _http.get(_uri('/api/notifications'), headers: _headers);
    return (_decode(res) as List<dynamic>)
        .map((e) => Notification.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
