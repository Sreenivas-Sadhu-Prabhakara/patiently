// GENERATED CODE — DO NOT EDIT BY HAND.
// Produced from the Zod schemas in @patiently/shared by `npm run codegen`.
// Money is integer minor units (paise). Friendly labels live in enums.dart.
// ignore_for_file: type=lint

enum DecisionStatus {
  proposed('proposed'),
  approved('approved'),
  rejected('rejected'),
  placed('placed'),
  failed('failed');

  const DecisionStatus(this.api);
  final String api;

  static DecisionStatus fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => values.first);
}

enum ItemCondition {
  newItem('new'),
  used('used'),
  refurbished('refurbished'),
  any('any');

  const ItemCondition(this.api);
  final String api;

  static ItemCondition fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => values.first);
}

enum NotificationType {
  dealFound('deal_found'),
  approvalNeeded('approval_needed'),
  purchased('purchased'),
  purchaseFailed('purchase_failed'),
  expiringSoon('expiring_soon');

  const NotificationType(this.api);
  final String api;

  static NotificationType fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => values.first);
}

enum StoreId {
  amazonIn('amazon_in'),
  flipkart('flipkart'),
  croma('croma'),
  relianceDigital('reliance_digital'),
  tataCliq('tata_cliq'),
  myntra('myntra');

  const StoreId(this.api);
  final String api;

  static StoreId fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => values.first);
}

enum WishStatus {
  active('active'),
  awaitingApproval('awaiting_approval'),
  purchasing('purchasing'),
  purchased('purchased'),
  cancelled('cancelled'),
  expired('expired');

  const WishStatus(this.api);
  final String api;

  static WishStatus fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => values.first);
}

class AuthResponse {
  AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    token: json['token'] as String,
    user: User.fromJson(json['user'] as Map<String, dynamic>),
  );

  final String token;
  final User user;

  Map<String, dynamic> toJson() => {'token': token, 'user': user.toJson()};
}

class CreateWishInput {
  CreateWishInput({
    required this.title,
    this.description,
    this.keywords,
    this.category,
    this.brand,
    this.model,
    required this.desiredByDate,
    this.maxBudgetCents,
    this.condition,
    this.currency,
    this.allowedStores,
  });

  factory CreateWishInput.fromJson(Map<String, dynamic> json) =>
      CreateWishInput(
        title: json['title'] as String,
        description: json['description'] == null
            ? null
            : json['description'] as String,
        keywords: json['keywords'] == null
            ? null
            : ((json['keywords'] as List<dynamic>?) ?? const [])
                  .map((e) => e as String)
                  .toList(),
        category: json['category'] == null ? null : json['category'] as String,
        brand: json['brand'] == null ? null : json['brand'] as String,
        model: json['model'] == null ? null : json['model'] as String,
        desiredByDate: DateTime.parse(json['desiredByDate'] as String),
        maxBudgetCents: json['maxBudgetCents'] == null
            ? null
            : (json['maxBudgetCents'] as num).toInt(),
        condition: json['condition'] == null
            ? null
            : ItemCondition.fromApi(json['condition'] as String),
        currency: json['currency'] == null ? null : json['currency'] as String,
        allowedStores: json['allowedStores'] == null
            ? null
            : ((json['allowedStores'] as List<dynamic>?) ?? const [])
                  .map((e) => StoreId.fromApi(e as String))
                  .toList(),
      );

  final String title;
  final String? description;
  final List<String>? keywords;
  final String? category;
  final String? brand;
  final String? model;
  final DateTime desiredByDate;
  final int? maxBudgetCents;
  final ItemCondition? condition;
  final String? currency;
  final List<StoreId>? allowedStores;

  Map<String, dynamic> toJson() => {
    'title': title,
    if (description != null) 'description': description!,
    if (keywords != null) 'keywords': keywords!.map((e) => e).toList(),
    if (category != null) 'category': category!,
    if (brand != null) 'brand': brand!,
    if (model != null) 'model': model!,
    'desiredByDate': desiredByDate.toUtc().toIso8601String(),
    if (maxBudgetCents != null) 'maxBudgetCents': maxBudgetCents!,
    if (condition != null) 'condition': condition!.api,
    if (currency != null) 'currency': currency!,
    if (allowedStores != null)
      'allowedStores': allowedStores!.map((e) => e.api).toList(),
  };
}

class DecisionInput {
  DecisionInput({required this.approve, this.reason});

  factory DecisionInput.fromJson(Map<String, dynamic> json) => DecisionInput(
    approve: json['approve'] as bool,
    reason: json['reason'] == null ? null : json['reason'] as String,
  );

  final bool approve;
  final String? reason;

  Map<String, dynamic> toJson() => {
    'approve': approve,
    if (reason != null) 'reason': reason!,
  };
}

class LoginInput {
  LoginInput({required this.email, this.name});

  factory LoginInput.fromJson(Map<String, dynamic> json) => LoginInput(
    email: json['email'] as String,
    name: json['name'] == null ? null : json['name'] as String,
  );

  final String email;
  final String? name;

  Map<String, dynamic> toJson() => {
    'email': email,
    if (name != null) 'name': name!,
  };
}

class Notification {
  Notification({
    required this.id,
    required this.userId,
    this.wishId,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) => Notification(
    id: json['id'] as String,
    userId: json['userId'] as String,
    wishId: json['wishId'] == null ? null : json['wishId'] as String,
    type: NotificationType.fromApi(json['type'] as String),
    title: json['title'] as String,
    body: json['body'] as String,
    read: json['read'] as bool,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  final String id;
  final String userId;
  final String? wishId;
  final NotificationType type;
  final String title;
  final String body;
  final bool read;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    if (wishId != null) 'wishId': wishId!,
    'type': type.api,
    'title': title,
    'body': body,
    'read': read,
    'createdAt': createdAt.toUtc().toIso8601String(),
  };
}

class Offer {
  Offer({
    required this.id,
    required this.wishId,
    required this.store,
    required this.externalId,
    required this.title,
    required this.url,
    this.imageUrl,
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
    required this.capturedAt,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
    id: json['id'] as String,
    wishId: json['wishId'] as String,
    store: StoreId.fromApi(json['store'] as String),
    externalId: json['externalId'] as String,
    title: json['title'] as String,
    url: json['url'] as String,
    imageUrl: json['imageUrl'] == null ? null : json['imageUrl'] as String,
    condition: ItemCondition.fromApi(json['condition'] as String),
    currency: json['currency'] as String,
    itemPriceCents: (json['itemPriceCents'] as num).toInt(),
    shippingCents: (json['shippingCents'] as num).toInt(),
    taxCents: (json['taxCents'] as num).toInt(),
    discountCents: (json['discountCents'] as num).toInt(),
    totalLandedCents: (json['totalLandedCents'] as num).toInt(),
    inStock: json['inStock'] as bool,
    rating: json['rating'] == null ? null : (json['rating'] as num).toDouble(),
    estDeliveryDays: json['estDeliveryDays'] == null
        ? null
        : (json['estDeliveryDays'] as num).toInt(),
    capturedAt: DateTime.parse(json['capturedAt'] as String),
  );

  final String id;
  final String wishId;
  final StoreId store;
  final String externalId;
  final String title;
  final String url;
  final String? imageUrl;
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
  final DateTime capturedAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'wishId': wishId,
    'store': store.api,
    'externalId': externalId,
    'title': title,
    'url': url,
    if (imageUrl != null) 'imageUrl': imageUrl!,
    'condition': condition.api,
    'currency': currency,
    'itemPriceCents': itemPriceCents,
    'shippingCents': shippingCents,
    'taxCents': taxCents,
    'discountCents': discountCents,
    'totalLandedCents': totalLandedCents,
    'inStock': inStock,
    if (rating != null) 'rating': rating!,
    if (estDeliveryDays != null) 'estDeliveryDays': estDeliveryDays!,
    'capturedAt': capturedAt.toUtc().toIso8601String(),
  };
}

class PurchaseDecision {
  PurchaseDecision({
    required this.id,
    required this.wishId,
    required this.offerId,
    required this.status,
    required this.reason,
    required this.totalLandedCents,
    required this.currency,
    required this.proposedAt,
    this.decidedAt,
    this.confirmationRef,
  });

  factory PurchaseDecision.fromJson(Map<String, dynamic> json) =>
      PurchaseDecision(
        id: json['id'] as String,
        wishId: json['wishId'] as String,
        offerId: json['offerId'] as String,
        status: DecisionStatus.fromApi(json['status'] as String),
        reason: json['reason'] as String,
        totalLandedCents: (json['totalLandedCents'] as num).toInt(),
        currency: json['currency'] as String,
        proposedAt: DateTime.parse(json['proposedAt'] as String),
        decidedAt: json['decidedAt'] == null
            ? null
            : DateTime.parse(json['decidedAt'] as String),
        confirmationRef: json['confirmationRef'] == null
            ? null
            : json['confirmationRef'] as String,
      );

  final String id;
  final String wishId;
  final String offerId;
  final DecisionStatus status;
  final String reason;
  final int totalLandedCents;
  final String currency;
  final DateTime proposedAt;
  final DateTime? decidedAt;
  final String? confirmationRef;

  Map<String, dynamic> toJson() => {
    'id': id,
    'wishId': wishId,
    'offerId': offerId,
    'status': status.api,
    'reason': reason,
    'totalLandedCents': totalLandedCents,
    'currency': currency,
    'proposedAt': proposedAt.toUtc().toIso8601String(),
    if (decidedAt != null) 'decidedAt': decidedAt!.toUtc().toIso8601String(),
    if (confirmationRef != null) 'confirmationRef': confirmationRef!,
  };
}

class SearchRun {
  SearchRun({
    required this.id,
    required this.wishId,
    required this.ranAt,
    required this.storesQueried,
    required this.offersFound,
    this.bestOfferId,
    this.bestLandedCents,
    required this.triggeredApproval,
    required this.note,
  });

  factory SearchRun.fromJson(Map<String, dynamic> json) => SearchRun(
    id: json['id'] as String,
    wishId: json['wishId'] as String,
    ranAt: DateTime.parse(json['ranAt'] as String),
    storesQueried: ((json['storesQueried'] as List<dynamic>?) ?? const [])
        .map((e) => StoreId.fromApi(e as String))
        .toList(),
    offersFound: (json['offersFound'] as num).toInt(),
    bestOfferId: json['bestOfferId'] == null
        ? null
        : json['bestOfferId'] as String,
    bestLandedCents: json['bestLandedCents'] == null
        ? null
        : (json['bestLandedCents'] as num).toInt(),
    triggeredApproval: json['triggeredApproval'] as bool,
    note: json['note'] as String,
  );

  final String id;
  final String wishId;
  final DateTime ranAt;
  final List<StoreId> storesQueried;
  final int offersFound;
  final String? bestOfferId;
  final int? bestLandedCents;
  final bool triggeredApproval;
  final String note;

  Map<String, dynamic> toJson() => {
    'id': id,
    'wishId': wishId,
    'ranAt': ranAt.toUtc().toIso8601String(),
    'storesQueried': storesQueried.map((e) => e.api).toList(),
    'offersFound': offersFound,
    if (bestOfferId != null) 'bestOfferId': bestOfferId!,
    if (bestLandedCents != null) 'bestLandedCents': bestLandedCents!,
    'triggeredApproval': triggeredApproval,
    'note': note,
  };
}

class UpdateWishInput {
  UpdateWishInput({
    this.title,
    this.description,
    this.keywords,
    this.category,
    this.brand,
    this.model,
    this.desiredByDate,
    this.maxBudgetCents,
    this.condition,
    this.currency,
    this.allowedStores,
    this.status,
  });

  factory UpdateWishInput.fromJson(Map<String, dynamic> json) =>
      UpdateWishInput(
        title: json['title'] == null ? null : json['title'] as String,
        description: json['description'] == null
            ? null
            : json['description'] as String,
        keywords: json['keywords'] == null
            ? null
            : ((json['keywords'] as List<dynamic>?) ?? const [])
                  .map((e) => e as String)
                  .toList(),
        category: json['category'] == null ? null : json['category'] as String,
        brand: json['brand'] == null ? null : json['brand'] as String,
        model: json['model'] == null ? null : json['model'] as String,
        desiredByDate: json['desiredByDate'] == null
            ? null
            : DateTime.parse(json['desiredByDate'] as String),
        maxBudgetCents: json['maxBudgetCents'] == null
            ? null
            : (json['maxBudgetCents'] as num).toInt(),
        condition: json['condition'] == null
            ? null
            : ItemCondition.fromApi(json['condition'] as String),
        currency: json['currency'] == null ? null : json['currency'] as String,
        allowedStores: json['allowedStores'] == null
            ? null
            : ((json['allowedStores'] as List<dynamic>?) ?? const [])
                  .map((e) => StoreId.fromApi(e as String))
                  .toList(),
        status: json['status'] == null
            ? null
            : WishStatus.fromApi(json['status'] as String),
      );

  final String? title;
  final String? description;
  final List<String>? keywords;
  final String? category;
  final String? brand;
  final String? model;
  final DateTime? desiredByDate;
  final int? maxBudgetCents;
  final ItemCondition? condition;
  final String? currency;
  final List<StoreId>? allowedStores;
  final WishStatus? status;

  Map<String, dynamic> toJson() => {
    if (title != null) 'title': title!,
    if (description != null) 'description': description!,
    if (keywords != null) 'keywords': keywords!.map((e) => e).toList(),
    if (category != null) 'category': category!,
    if (brand != null) 'brand': brand!,
    if (model != null) 'model': model!,
    if (desiredByDate != null)
      'desiredByDate': desiredByDate!.toUtc().toIso8601String(),
    if (maxBudgetCents != null) 'maxBudgetCents': maxBudgetCents!,
    if (condition != null) 'condition': condition!.api,
    if (currency != null) 'currency': currency!,
    if (allowedStores != null)
      'allowedStores': allowedStores!.map((e) => e.api).toList(),
    if (status != null) 'status': status!.api,
  };
}

class User {
  User({
    required this.id,
    required this.email,
    required this.name,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as String,
    email: json['email'] as String,
    name: json['name'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  final String id;
  final String email;
  final String name;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'createdAt': createdAt.toUtc().toIso8601String(),
  };
}

class Wish {
  Wish({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.keywords,
    required this.category,
    this.brand,
    this.model,
    required this.desiredByDate,
    this.maxBudgetCents,
    required this.condition,
    required this.currency,
    required this.allowedStores,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Wish.fromJson(Map<String, dynamic> json) => Wish(
    id: json['id'] as String,
    userId: json['userId'] as String,
    title: json['title'] as String,
    description: json['description'] as String,
    keywords: ((json['keywords'] as List<dynamic>?) ?? const [])
        .map((e) => e as String)
        .toList(),
    category: json['category'] as String,
    brand: json['brand'] == null ? null : json['brand'] as String,
    model: json['model'] == null ? null : json['model'] as String,
    desiredByDate: DateTime.parse(json['desiredByDate'] as String),
    maxBudgetCents: json['maxBudgetCents'] == null
        ? null
        : (json['maxBudgetCents'] as num).toInt(),
    condition: ItemCondition.fromApi(json['condition'] as String),
    currency: json['currency'] as String,
    allowedStores: ((json['allowedStores'] as List<dynamic>?) ?? const [])
        .map((e) => StoreId.fromApi(e as String))
        .toList(),
    status: WishStatus.fromApi(json['status'] as String),
    createdAt: DateTime.parse(json['createdAt'] as String),
    updatedAt: DateTime.parse(json['updatedAt'] as String),
  );

  final String id;
  final String userId;
  final String title;
  final String description;
  final List<String> keywords;
  final String category;
  final String? brand;
  final String? model;
  final DateTime desiredByDate;
  final int? maxBudgetCents;
  final ItemCondition condition;
  final String currency;
  final List<StoreId> allowedStores;
  final WishStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'title': title,
    'description': description,
    'keywords': keywords.map((e) => e).toList(),
    'category': category,
    if (brand != null) 'brand': brand!,
    if (model != null) 'model': model!,
    'desiredByDate': desiredByDate.toUtc().toIso8601String(),
    if (maxBudgetCents != null) 'maxBudgetCents': maxBudgetCents!,
    'condition': condition.api,
    'currency': currency,
    'allowedStores': allowedStores.map((e) => e.api).toList(),
    'status': status.api,
    'createdAt': createdAt.toUtc().toIso8601String(),
    'updatedAt': updatedAt.toUtc().toIso8601String(),
  };
}

class WishView {
  WishView({
    required this.wish,
    this.bestOffer,
    required this.recentOffers,
    this.pendingDecision,
    this.lastSearchRun,
    this.savingsVsMedianCents,
  });

  factory WishView.fromJson(Map<String, dynamic> json) => WishView(
    wish: Wish.fromJson(json['wish'] as Map<String, dynamic>),
    bestOffer: json['bestOffer'] == null
        ? null
        : Offer.fromJson(json['bestOffer'] as Map<String, dynamic>),
    recentOffers: ((json['recentOffers'] as List<dynamic>?) ?? const [])
        .map((e) => Offer.fromJson(e as Map<String, dynamic>))
        .toList(),
    pendingDecision: json['pendingDecision'] == null
        ? null
        : PurchaseDecision.fromJson(
            json['pendingDecision'] as Map<String, dynamic>,
          ),
    lastSearchRun: json['lastSearchRun'] == null
        ? null
        : SearchRun.fromJson(json['lastSearchRun'] as Map<String, dynamic>),
    savingsVsMedianCents: json['savingsVsMedianCents'] == null
        ? null
        : (json['savingsVsMedianCents'] as num).toInt(),
  );

  final Wish wish;
  final Offer? bestOffer;
  final List<Offer> recentOffers;
  final PurchaseDecision? pendingDecision;
  final SearchRun? lastSearchRun;
  final int? savingsVsMedianCents;

  Map<String, dynamic> toJson() => {
    'wish': wish.toJson(),
    if (bestOffer != null) 'bestOffer': bestOffer!.toJson(),
    'recentOffers': recentOffers.map((e) => e.toJson()).toList(),
    if (pendingDecision != null) 'pendingDecision': pendingDecision!.toJson(),
    if (lastSearchRun != null) 'lastSearchRun': lastSearchRun!.toJson(),
    if (savingsVsMedianCents != null)
      'savingsVsMedianCents': savingsVsMedianCents!,
  };
}
