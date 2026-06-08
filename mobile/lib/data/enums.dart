// Enums are generated from the Zod schemas (see api.g.dart). The human-facing
// labels — which the schemas don't (and shouldn't) carry — live here as
// extensions, so `.label` stays available throughout the UI.
import 'api.g.dart';

export 'api.g.dart'
    show StoreId, ItemCondition, WishStatus, DecisionStatus, NotificationType;

extension StoreLabel on StoreId {
  String get label => switch (this) {
    StoreId.amazonIn => 'Amazon.in',
    StoreId.flipkart => 'Flipkart',
    StoreId.croma => 'Croma',
    StoreId.relianceDigital => 'Reliance Digital',
    StoreId.tataCliq => 'Tata CLiQ',
    StoreId.myntra => 'Myntra',
  };
}

extension ConditionLabel on ItemCondition {
  String get label => switch (this) {
    ItemCondition.newItem => 'New',
    ItemCondition.used => 'Used',
    ItemCondition.refurbished => 'Refurbished',
    ItemCondition.any => 'Any',
  };
}

extension StatusLabel on WishStatus {
  String get label => switch (this) {
    WishStatus.active => 'Hunting',
    WishStatus.awaitingApproval => 'Approve to buy',
    WishStatus.purchasing => 'Buying…',
    WishStatus.purchased => 'Purchased',
    WishStatus.cancelled => 'Cancelled',
    WishStatus.expired => 'Expired',
  };
}
