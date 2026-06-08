import 'package:flutter/foundation.dart';

import '../data/api_client.dart';
import '../data/enums.dart';
import '../data/models.dart';

/// Owns the wish list and the actions on it (create / search-now / approve /
/// reject / cancel). On a 401 it calls [onUnauthorized] so the session is
/// dropped and the user is returned to sign-in.
class WishesController extends ChangeNotifier {
  WishesController(this._api, {required this.onUnauthorized});

  final ApiClient _api;
  final VoidCallback onUnauthorized;

  List<WishView> _wishes = const [];
  bool _loading = false;
  String? _error;

  /// Cancelled wishes are hidden, matching the web client.
  List<WishView> get wishes =>
      _wishes.where((w) => w.wish.status != WishStatus.cancelled).toList();
  bool get loading => _loading;
  String? get error => _error;
  int get awaitingCount =>
      wishes.where((w) => w.wish.status == WishStatus.awaitingApproval).length;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _wishes = await _api.listWishes();
    } on UnauthorizedException {
      onUnauthorized();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> createWish(CreateWishInput input) =>
      _run(() => _api.createWish(input));
  Future<bool> searchNow(String id) => _run(() => _api.searchNow(id));
  Future<bool> decide(String id, {required bool approve}) =>
      _run(() => _api.decide(id, approve: approve));
  Future<bool> cancel(String id) => _run(() => _api.cancelWish(id));

  /// Perform a mutating action, then refresh the list from the server.
  /// Returns true on success; on a 401 it triggers [onUnauthorized].
  Future<bool> _run(Future<void> Function() action) async {
    try {
      await action();
      _wishes = await _api.listWishes();
      _error = null;
      notifyListeners();
      return true;
    } on UnauthorizedException {
      onUnauthorized();
      return false;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
