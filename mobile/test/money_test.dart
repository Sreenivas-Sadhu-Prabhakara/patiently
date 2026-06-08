import 'package:flutter_test/flutter_test.dart';
import 'package:patiently/core/money.dart';

void main() {
  group('formatMoney', () {
    test('formats INR with ₹ and Indian (lakh) digit grouping', () {
      expect(formatMoney(12999), '₹129.99');
      // 15,00,000.00 paise = ₹15,000.00
      expect(formatMoney(150000000), '₹15,00,000.00');
    });
  });

  group('formatHorizon', () {
    test('reports months for a multi-month horizon', () {
      final DateTime inFourMonths = DateTime.now().add(
        const Duration(days: 120),
      );
      expect(formatHorizon(inFourMonths), contains('month'));
    });

    test('reports past due for an elapsed date', () {
      final DateTime yesterday = DateTime.now().subtract(
        const Duration(days: 1),
      );
      expect(formatHorizon(yesterday), 'past due');
    });
  });
}
