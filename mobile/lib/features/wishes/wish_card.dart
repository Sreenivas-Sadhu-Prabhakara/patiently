import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/biometric.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../../data/enums.dart';
import '../../data/models.dart';
import '../../state/wishes_controller.dart';

class WishCard extends StatefulWidget {
  const WishCard({super.key, required this.view});
  final WishView view;

  @override
  State<WishCard> createState() => _WishCardState();
}

class _WishCardState extends State<WishCard> {
  bool _busy = false;

  WishView get view => widget.view;
  Wish get wish => view.wish;

  Future<void> _decide(bool approve) async {
    final WishesController controller = context.read<WishesController>();
    setState(() => _busy = true);
    if (approve) {
      final Offer? best = view.bestOffer;
      final String amount = best == null
          ? ''
          : ' ${formatMoney(best.totalLandedCents, currency: best.currency)}';
      final bool confirmed = await Biometric.confirm('Approve & buy$amount');
      if (!confirmed) {
        if (mounted) setState(() => _busy = false);
        return;
      }
    }
    await controller.decide(wish.id, approve: approve);
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _searchNow() async {
    final WishesController controller = context.read<WishesController>();
    setState(() => _busy = true);
    await controller.searchNow(wish.id);
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _cancel() async {
    final WishesController controller = context.read<WishesController>();
    setState(() => _busy = true);
    await controller.cancel(wish.id);
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final Offer? best = view.bestOffer;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _header(),
            const SizedBox(height: 12),
            if (best != null) _bestOffer(best) else _noOffers(),
            if (view.recentOffers.length > 1) _offersList(),
            if (wish.status == WishStatus.awaitingApproval &&
                view.pendingDecision != null)
              _proposal(view.pendingDecision!),
            if (wish.status == WishStatus.active ||
                wish.status == WishStatus.expired)
              _activeActions(),
            if (wish.status == WishStatus.purchased && best != null)
              _purchased(best),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    final String horizon = formatHorizon(wish.desiredByDate);
    final String sub = wish.maxBudgetCents != null
        ? '$horizon · budget ${formatMoney(wish.maxBudgetCents!, currency: wish.currency)}'
        : horizon;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                wish.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                sub,
                style: const TextStyle(
                  color: PatientlyTheme.inkSoft,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        _StatusBadge(status: wish.status),
      ],
    );
  }

  Widget _bestOffer(Offer best) {
    final int? savings = view.savingsVsMedianCents;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PatientlyTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'Best landed price',
                style: TextStyle(
                  color: PatientlyTheme.inkSoft,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                formatMoney(best.totalLandedCents, currency: best.currency),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _breakdown(best),
            style: const TextStyle(color: PatientlyTheme.inkSoft, fontSize: 12),
          ),
          if (savings != null && savings > 0) ...[
            const SizedBox(height: 8),
            Text(
              'Saving ${formatMoney(savings, currency: best.currency)} vs. the typical price',
              style: const TextStyle(
                color: PatientlyTheme.good,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _breakdown(Offer best) {
    final String item = formatMoney(
      best.itemPriceCents,
      currency: best.currency,
    );
    final String ship = formatMoney(
      best.shippingCents,
      currency: best.currency,
    );
    final String taxPart = best.taxCents > 0
        ? ' + tax ${formatMoney(best.taxCents, currency: best.currency)}'
        : ' · incl. GST';
    final String discountPart = best.discountCents > 0
        ? ' − ${formatMoney(best.discountCents, currency: best.currency)} off'
        : '';
    return '${best.store.label} · item $item + shipping $ship$taxPart$discountPart';
  }

  Widget _noOffers() {
    return const Text(
      'No offers captured yet — run a search to populate prices.',
      style: TextStyle(color: PatientlyTheme.inkSoft, fontSize: 14),
    );
  }

  Widget _offersList() {
    final offers = view.recentOffers.take(5).toList();
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: const EdgeInsets.only(bottom: 8),
        title: Text(
          '${view.recentOffers.length} offers compared',
          style: const TextStyle(
            color: PatientlyTheme.primary,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        children: offers
            .map(
              (o) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      o.store.label,
                      style: const TextStyle(color: PatientlyTheme.inkSoft),
                    ),
                    Text(
                      o.condition.label,
                      style: const TextStyle(color: PatientlyTheme.inkSoft),
                    ),
                    Text(
                      formatMoney(o.totalLandedCents, currency: o.currency),
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _proposal(PurchaseDecision decision) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Divider(height: 1),
          const SizedBox(height: 12),
          Text(decision.reason, style: const TextStyle(fontSize: 14)),
          const SizedBox(height: 12),
          Row(
            children: [
              OutlinedButton(
                onPressed: _busy ? null : () => _decide(false),
                child: const Text('Not now'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton(
                  onPressed: _busy ? null : () => _decide(true),
                  child: Text(
                    _busy
                        ? 'Working…'
                        : 'Approve & buy ${formatMoney(decision.totalLandedCents, currency: decision.currency)}',
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _activeActions() {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          OutlinedButton(
            onPressed: _busy ? null : _searchNow,
            child: Text(_busy ? 'Checking…' : 'Check price now'),
          ),
          TextButton(
            onPressed: _busy ? null : _cancel,
            child: const Text(
              'Remove',
              style: TextStyle(color: PatientlyTheme.inkSoft),
            ),
          ),
        ],
      ),
    );
  }

  Widget _purchased(Offer best) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Text(
        '✓ Ordered from ${best.store.label} · ${formatMoney(best.totalLandedCents, currency: best.currency)} shipped',
        style: const TextStyle(
          color: PatientlyTheme.good,
          fontWeight: FontWeight.w700,
          fontSize: 14,
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final WishStatus status;

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg) = switch (status) {
      WishStatus.active => (const Color(0xFFECEAFF), PatientlyTheme.primary),
      WishStatus.awaitingApproval => (
        PatientlyTheme.accent,
        const Color(0xFF4A2C00),
      ),
      WishStatus.purchasing => (
        const Color(0xFFECEAFF),
        PatientlyTheme.primary,
      ),
      WishStatus.purchased => (const Color(0xFFE7F6EF), PatientlyTheme.good),
      WishStatus.cancelled ||
      WishStatus.expired => (const Color(0xFFFBE9EC), PatientlyTheme.danger),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.label,
        style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 11),
      ),
    );
  }
}
