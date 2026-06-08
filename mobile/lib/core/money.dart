import 'package:intl/intl.dart';

/// Money is integer minor units (paise) end-to-end; format only at the edge,
/// India-first (₹, en-IN lakh/crore grouping).
final NumberFormat _inr = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
);

String formatMoney(int minorUnits, {String currency = 'INR'}) {
  final double major = minorUnits / 100;
  if (currency == 'INR') return _inr.format(major);
  return NumberFormat.currency(locale: 'en_IN', name: currency).format(major);
}

/// Human "time left" for a desired-by date, mirroring the web client.
String formatHorizon(DateTime desiredBy) {
  final int days = desiredBy.difference(DateTime.now()).inHours ~/ 24;
  if (days < 0) return 'past due';
  if (days == 0) return 'due today';
  if (days < 31) return '$days day${days == 1 ? '' : 's'} left';
  final int months = (days / 30).round();
  return '~$months month${months == 1 ? '' : 's'} left';
}
