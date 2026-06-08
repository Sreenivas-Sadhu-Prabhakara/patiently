import 'enums.dart';

int _int(dynamic v) => (v as num).toInt();
int? _intOrNull(dynamic v) => v == null ? null : (v as num).toInt();
double? _doubleOrNull(dynamic v) => v == null ? null : (v as num).toDouble();

class AppUser {
  AppUser({required this.id, required this.email, required this.name});

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: json['id'] as String,
    email: json['email'] as String,
    name: json['name'] as String,
  );

  final String id;
  final String email;
  final String name;
}

class AuthResponse {
  AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    token: json['token'] as String,
    user: AppUser.fromJson(json['user'] as Map<String, dynamic>),
  );

  final String token;
  final AppUser user;
}

class Offer {
  Offer({
    required this.id,
    required this.store,
    required this.title,
    required this.url,
    required this.condition,
    required this.currency,
    required this.itemPriceCents,
    required this.shippingCents,
    required this.taxCents,
    required this.discountCents,
    required this.totalLandedCents,
    required this.inStock,
    this.rating,
    this.estDeliveryDays,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
    id: json['id'] as String,
    store: StoreId.fromApi(json['store'] as String),
    title: json['title'] as String,
    url: json['url'] as String,
    condition: ItemCondition.fromApi(json['condition'] as String),
    currency: json['currency'] as String,
    itemPriceCents: _int(json['itemPriceCents']),
    shippingCents: _int(json['shippingCents']),
    taxCents: _int(json['taxCents']),
    discountCents: _int(json['discountCents']),
    totalLandedCents: _int(json['totalLandedCents']),
    inStock: json['inStock'] as bool,
    rating: _doubleOrNull(json['rating']),
    estDeliveryDays: _intOrNull(json['estDeliveryDays']),
  );

  final String id;
  final StoreId store;
  final String title;
  final String url;
  final ItemCondition condition;
  final String currency;
  final int itemPriceCents;
  final int shippingCents;
  final int taxCents;
  final int discountCents;
  final int totalLandedCents;
  final bool inStock;
  final double? rating;
  final int? estDeliveryDays;
}

class Wish {
  Wish({
    required this.id,
    required this.title,
    required this.description,
    required this.desiredByDate,
    required this.condition,
    required this.currency,
    required this.status,
    required this.allowedStores,
    this.brand,
    this.maxBudgetCents,
  });

  factory Wish.fromJson(Map<String, dynamic> json) => Wish(
    id: json['id'] as String,
    title: json['title'] as String,
    description: (json['description'] as String?) ?? '',
    desiredByDate: DateTime.parse(json['desiredByDate'] as String),
    condition: ItemCondition.fromApi(json['condition'] as String),
    currency: json['currency'] as String,
    status: WishStatus.fromApi(json['status'] as String),
    allowedStores: ((json['allowedStores'] as List<dynamic>?) ?? const [])
        .map((e) => StoreId.fromApi(e as String))
        .toList(),
    brand: json['brand'] as String?,
    maxBudgetCents: _intOrNull(json['maxBudgetCents']),
  );

  final String id;
  final String title;
  final String description;
  final DateTime desiredByDate;
  final ItemCondition condition;
  final String currency;
  final WishStatus status;
  final List<StoreId> allowedStores;
  final String? brand;
  final int? maxBudgetCents;
}

class PurchaseDecision {
  PurchaseDecision({
    required this.id,
    required this.status,
    required this.reason,
    required this.totalLandedCents,
    required this.currency,
    this.confirmationRef,
  });

  factory PurchaseDecision.fromJson(Map<String, dynamic> json) =>
      PurchaseDecision(
        id: json['id'] as String,
        status: json['status'] as String,
        reason: (json['reason'] as String?) ?? '',
        totalLandedCents: _int(json['totalLandedCents']),
        currency: json['currency'] as String,
        confirmationRef: json['confirmationRef'] as String?,
      );

  final String id;
  final String status;
  final String reason;
  final int totalLandedCents;
  final String currency;
  final String? confirmationRef;
}

class WishView {
  WishView({
    required this.wish,
    required this.recentOffers,
    this.bestOffer,
    this.pendingDecision,
    this.savingsVsMedianCents,
  });

  factory WishView.fromJson(Map<String, dynamic> json) => WishView(
    wish: Wish.fromJson(json['wish'] as Map<String, dynamic>),
    recentOffers: ((json['recentOffers'] as List<dynamic>?) ?? const [])
        .map((e) => Offer.fromJson(e as Map<String, dynamic>))
        .toList(),
    bestOffer: json['bestOffer'] == null
        ? null
        : Offer.fromJson(json['bestOffer'] as Map<String, dynamic>),
    pendingDecision: json['pendingDecision'] == null
        ? null
        : PurchaseDecision.fromJson(
            json['pendingDecision'] as Map<String, dynamic>,
          ),
    savingsVsMedianCents: _intOrNull(json['savingsVsMedianCents']),
  );

  final Wish wish;
  final List<Offer> recentOffers;
  final Offer? bestOffer;
  final PurchaseDecision? pendingDecision;
  final int? savingsVsMedianCents;
}

class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        type: json['type'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        read: json['read'] as bool,
      );

  final String id;
  final String type;
  final String title;
  final String body;
  final bool read;
}

/// Payload for creating a wish (mirrors `CreateWishInput`).
class CreateWishInput {
  CreateWishInput({
    required this.title,
    required this.desiredByDate,
    required this.condition,
    required this.allowedStores,
    this.brand,
    this.maxBudgetCents,
  });

  final String title;
  final DateTime desiredByDate;
  final ItemCondition condition;
  final List<StoreId> allowedStores;
  final String? brand;
  final int? maxBudgetCents;

  Map<String, dynamic> toJson() => {
    'title': title,
    'desiredByDate': desiredByDate.toUtc().toIso8601String(),
    'condition': condition.api,
    'allowedStores': allowedStores.map((e) => e.api).toList(),
    if (brand != null && brand!.isNotEmpty) 'brand': brand,
    if (maxBudgetCents != null) 'maxBudgetCents': maxBudgetCents,
  };
}
