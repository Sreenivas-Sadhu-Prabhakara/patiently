import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../state/auth_controller.dart';
import '../../state/wishes_controller.dart';
import 'wish_card.dart';
import 'wish_form_screen.dart';

class WishesScreen extends StatefulWidget {
  const WishesScreen({super.key});

  @override
  State<WishesScreen> createState() => _WishesScreenState();
}

class _WishesScreenState extends State<WishesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<WishesController>().load();
    });
  }

  Future<void> _openForm() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute<void>(builder: (_) => const WishFormScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final WishesController controller = context.watch<WishesController>();
    final wishes = controller.wishes;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 20,
        title: Row(
          children: [
            const Icon(Icons.schedule, color: PatientlyTheme.gold, size: 16),
            const SizedBox(width: 9),
            Text(
              'Patiently',
              style: PatientlyTheme.serif(size: 21, weight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => context.read<AuthController>().logout(),
            child: const Text('SIGN OUT'),
          ),
          const SizedBox(width: 8),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openForm,
        backgroundColor: PatientlyTheme.gold,
        foregroundColor: PatientlyTheme.onGold,
        elevation: 0,
        highlightElevation: 0,
        icon: const Icon(Icons.add, size: 18),
        label: Text(
          'ADD A WISH',
          style: PatientlyTheme.label(size: 11, color: PatientlyTheme.onGold),
        ),
      ),
      body: RefreshIndicator(
        color: PatientlyTheme.gold,
        backgroundColor: PatientlyTheme.surface,
        onRefresh: controller.load,
        child: _Body(controller: controller, wishCount: wishes.length),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.controller, required this.wishCount});

  final WishesController controller;
  final int wishCount;

  @override
  Widget build(BuildContext context) {
    if (controller.loading && wishCount == 0) {
      return const Center(
        child: CircularProgressIndicator(color: PatientlyTheme.gold),
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 26, 24, 110),
      children: [
        _Summary(count: wishCount, awaiting: controller.awaitingCount),
        if (controller.error != null) ...[
          const SizedBox(height: 16),
          _ErrorBanner(message: controller.error!),
        ],
        const SizedBox(height: 20),
        if (wishCount == 0)
          const _Empty()
        else
          ...controller.wishes.map((view) => WishCard(view: view)),
      ],
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.count, required this.awaiting});
  final int count;
  final int awaiting;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$count ITEM${count == 1 ? '' : 'S'} ON THE HUNT',
          style: PatientlyTheme.label(
            size: 11,
            color: PatientlyTheme.inkFaint,
            tracking: 2.2,
          ),
        ),
        if (awaiting > 0) ...[
          Text(
            '   ·   ',
            style: PatientlyTheme.label(
              size: 11,
              color: PatientlyTheme.inkFaint,
            ),
          ),
          Text(
            '$awaiting READY TO BUY',
            style: PatientlyTheme.label(
              size: 11,
              color: PatientlyTheme.gold,
              tracking: 2.0,
            ),
          ),
        ],
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: PatientlyTheme.danger.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        message,
        style: const TextStyle(color: PatientlyTheme.danger, fontSize: 13),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 8),
      child: Column(
        children: [
          Text(
            'Nothing on the hunt, yet.',
            textAlign: TextAlign.center,
            style: PatientlyTheme.serif(size: 26, weight: FontWeight.w300),
          ),
          const SizedBox(height: 14),
          Text(
            'Name something you want in the next three to six months. '
            "We'll watch the price across stores, quietly, and tell you "
            'when the moment is right.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: PatientlyTheme.inkFaint,
              height: 1.7,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
