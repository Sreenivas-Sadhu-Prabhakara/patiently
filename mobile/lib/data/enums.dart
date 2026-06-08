// Domain enumerations, mirroring `@patiently/shared` on the server. Each value
// carries its API string and a display label so JSON mapping and UI stay in one
// place.

enum StoreId {
  amazonIn('amazon_in', 'Amazon.in'),
  flipkart('flipkart', 'Flipkart'),
  croma('croma', 'Croma'),
  relianceDigital('reliance_digital', 'Reliance Digital'),
  tataCliq('tata_cliq', 'Tata CLiQ'),
  myntra('myntra', 'Myntra');

  const StoreId(this.api, this.label);
  final String api;
  final String label;

  static StoreId fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => StoreId.amazonIn);
}

enum ItemCondition {
  newItem('new', 'New'),
  used('used', 'Used'),
  refurbished('refurbished', 'Refurbished'),
  any('any', 'Any');

  const ItemCondition(this.api, this.label);
  final String api;
  final String label;

  static ItemCondition fromApi(String value) => values.firstWhere(
    (e) => e.api == value,
    orElse: () => ItemCondition.newItem,
  );
}

enum WishStatus {
  active('active', 'Hunting'),
  awaitingApproval('awaiting_approval', 'Approve to buy'),
  purchasing('purchasing', 'Buying…'),
  purchased('purchased', 'Purchased'),
  cancelled('cancelled', 'Cancelled'),
  expired('expired', 'Expired');

  const WishStatus(this.api, this.label);
  final String api;
  final String label;

  static WishStatus fromApi(String value) =>
      values.firstWhere((e) => e.api == value, orElse: () => WishStatus.active);
}
