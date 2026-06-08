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
    final bool awaiting = wish.status == WishStatus.awaitingApproval;

    final Widget content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _header(),
        if (best != null) _bestOffer(best) else _noOffers(),
        if (view.recentOffers.length > 1) _offersList(),
        if (awaiting && view.pendingDecision != null)
          _proposal(view.pendingDecision!),
        if (wish.status == WishStatus.active ||
            wish.status == WishStatus.expired)
          _activeActions(),
        if (wish.status == WishStatus.purchased && best != null)
          _purchased(best),
      ],
    );

    if (awaiting) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.fromLTRB(18, 22, 18, 22),
        decoration: BoxDecoration(
          color: PatientlyTheme.surface,
          borderRadius: BorderRadius.circular(3),
          border: const Border(
            left: BorderSide(color: PatientlyTheme.gold, width: 2),
          ),
        ),
        child: content,
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 26),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: PatientlyTheme.line)),
      ),
      child: Opacity(
        opacity: wish.status == WishStatus.purchased ? 0.55 : 1,
        child: content,
      ),
    );
  }

  Widget _header() {
    final String horizon = formatHorizon(wish.desiredByDate);
    final String sub = wish.maxBudgetCents != null
        ? '$horizon · BUDGET ${formatMoney(wish.maxBudgetCents!, currency: wish.currency)}'
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
                style: PatientlyTheme.serif(
                  size: 21,
                  weight: FontWeight.w400,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                sub.toUpperCase(),
                style: PatientlyTheme.label(
                  size: 10,
                  color: PatientlyTheme.inkFaint,
                  tracking: 1.4,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        _StatusBadge(status: wish.status),
      ],
    );
  }

  Widget _bestOffer(Offer best) {
    final int? savings = view.savingsVsMedianCents;
    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'BEST LANDED PRICE',
                style: PatientlyTheme.label(
                  size: 10,
                  color: PatientlyTheme.inkFaint,
                  tracking: 2.0,
                ),
              ),
              Text(
                formatMoney(best.totalLandedCents, currency: best.currency),
                style: PatientlyTheme.serif(size: 33, weight: FontWeight.w400),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Text(
            _breakdown(best),
            style: const TextStyle(
              color: PatientlyTheme.inkFaint,
              fontSize: 11.5,
              height: 1.6,
            ),
          ),
          if (savings != null && savings > 0) ...[
            const SizedBox(height: 12),
            Text(
              'SAVING ${formatMoney(savings, currency: best.currency)} VS. THE TYPICAL PRICE',
              style: PatientlyTheme.label(
                size: 10,
                color: PatientlyTheme.good,
                tracking: 1.4,
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
    return const Padding(
      padding: EdgeInsets.only(top: 18),
      child: Text(
        'No offers captured yet — run a search to populate prices.',
        style: TextStyle(color: PatientlyTheme.inkFaint, fontSize: 13),
      ),
    );
  }

  Widget _offersList() {
    final offers = view.recentOffers.take(5).toList();
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: const EdgeInsets.only(bottom: 6),
        iconColor: PatientlyTheme.gold,
        collapsedIconColor: PatientlyTheme.inkFaint,
        title: Text(
          '${view.recentOffers.length} OFFERS COMPARED',
          style: PatientlyTheme.label(
            size: 10,
            color: PatientlyTheme.gold,
            tracking: 1.8,
          ),
        ),
        children: offers
            .map(
              (o) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      o.store.label,
                      style: const TextStyle(
                        color: PatientlyTheme.inkDim,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      o.condition.label.toUpperCase(),
                      style: PatientlyTheme.label(
                        size: 9,
                        color: PatientlyTheme.inkFaint,
                        tracking: 1.2,
                      ),
                    ),
                    Text(
                      formatMoney(o.totalLandedCents, currency: o.currency),
                      style: const TextStyle(
                        color: PatientlyTheme.ink,
                        fontSize: 12,
                      ),
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
      padding: const EdgeInsets.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Divider(height: 1, color: PatientlyTheme.lineStrong),
          const SizedBox(height: 18),
          Text(
            decision.reason,
            style: PatientlyTheme.serif(
              size: 17,
              weight: FontWeight.w400,
              color: PatientlyTheme.ink,
              height: 1.45,
              style: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              OutlinedButton(
                onPressed: _busy ? null : () => _decide(false),
                child: const Text('NOT NOW'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _busy ? null : () => _decide(true),
                  child: Text(
                    _busy
                        ? 'WORKING…'
                        : 'APPROVE & BUY ${formatMoney(decision.totalLandedCents, currency: decision.currency)}',
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
      padding: const EdgeInsets.only(top: 22),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          OutlinedButton(
            onPressed: _busy ? null : _searchNow,
            child: Text(_busy ? 'CHECKING…' : 'CHECK PRICE NOW'),
          ),
          TextButton(
            onPressed: _busy ? null : _cancel,
            child: const Text('REMOVE'),
          ),
        ],
      ),
    );
  }

  Widget _purchased(Offer best) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Text(
        '✓ ORDERED FROM ${best.store.label.toUpperCase()} · ${formatMoney(best.totalLandedCents, currency: best.currency)} SHIPPED',
        style: PatientlyTheme.label(
          size: 10,
          color: PatientlyTheme.good,
          tracking: 1.4,
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
    final Color color = switch (status) {
      WishStatus.active => PatientlyTheme.inkDim,
      WishStatus.awaitingApproval => PatientlyTheme.gold,
      WishStatus.purchasing => PatientlyTheme.gold,
      WishStatus.purchased => PatientlyTheme.good,
      WishStatus.cancelled || WishStatus.expired => PatientlyTheme.danger,
    };
    return Padding(
      padding: const EdgeInsets.only(top: 3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 7),
          Text(
            status.label.toUpperCase(),
            style: PatientlyTheme.label(size: 9, color: color, tracking: 1.6),
          ),
        ],
      ),
    );
  }
}
