import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:patiently/data/enums.dart';
import 'package:patiently/data/models.dart';

const String _wishViewJson = '''
{
  "wish": {
    "id": "w1", "userId": "u1", "title": "Sony WH-1000XM5",
    "description": "", "keywords": [], "category": "electronics",
    "desiredByDate": "2026-10-01T00:00:00.000Z",
    "condition": "new", "currency": "INR",
    "allowedStores": ["amazon_in", "flipkart"],
    "status": "awaiting_approval",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z",
    "maxBudgetCents": 2699000
  },
  "bestOffer": {
    "id": "o1", "wishId": "w1", "store": "flipkart", "externalId": "x",
    "title": "t", "url": "https://example.test", "condition": "new",
    "currency": "INR", "itemPriceCents": 2500000, "shippingCents": 0,
    "taxCents": 0, "discountCents": 0, "totalLandedCents": 2500000,
    "inStock": true, "capturedAt": "2026-06-01T00:00:00.000Z"
  },
  "recentOffers": [],
  "pendingDecision": null,
  "lastSearchRun": null,
  "savingsVsMedianCents": 12345
}
''';

void main() {
  test('parses a WishView from the API JSON', () {
    final WishView view = WishView.fromJson(
      jsonDecode(_wishViewJson) as Map<String, dynamic>,
    );

    expect(view.wish.title, 'Sony WH-1000XM5');
    expect(view.wish.status, WishStatus.awaitingApproval);
    expect(view.wish.allowedStores, [StoreId.amazonIn, StoreId.flipkart]);
    expect(view.wish.maxBudgetCents, 2699000);
    expect(view.bestOffer, isNotNull);
    expect(view.bestOffer!.store, StoreId.flipkart);
    expect(view.bestOffer!.totalLandedCents, 2500000);
    expect(view.savingsVsMedianCents, 12345);
  });

  test('CreateWishInput serialises to the API shape', () {
    final CreateWishInput input = CreateWishInput(
      title: 'Samsung 55-inch TV',
      desiredByDate: DateTime.utc(2026, 12, 1),
      condition: ItemCondition.any,
      allowedStores: const [StoreId.croma, StoreId.relianceDigital],
      brand: 'Samsung',
      maxBudgetCents: 9000000,
    );

    final Map<String, dynamic> json = input.toJson();
    expect(json['title'], 'Samsung 55-inch TV');
    expect(json['condition'], 'any');
    expect(json['allowedStores'], ['croma', 'reliance_digital']);
    expect(json['brand'], 'Samsung');
    expect(json['maxBudgetCents'], 9000000);
  });

  test('omits empty brand from the payload', () {
    final CreateWishInput input = CreateWishInput(
      title: 'Anything',
      desiredByDate: DateTime.utc(2026, 12, 1),
      condition: ItemCondition.newItem,
      allowedStores: const [],
      brand: '',
    );
    expect(input.toJson().containsKey('brand'), isFalse);
    expect(input.toJson().containsKey('maxBudgetCents'), isFalse);
  });
}
