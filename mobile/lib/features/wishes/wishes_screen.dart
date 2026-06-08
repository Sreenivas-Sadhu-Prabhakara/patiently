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
        titleSpacing: 16,
        title: Row(
          children: const [
            Icon(Icons.schedule, color: PatientlyTheme.accent),
            SizedBox(width: 8),
            Text('Patiently', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => context.read<AuthController>().logout(),
            child: const Text('Sign out'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openForm,
        backgroundColor: PatientlyTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add a wish'),
      ),
      body: RefreshIndicator(
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
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        _Summary(count: wishCount, awaiting: controller.awaitingCount),
        if (controller.error != null) ...[
          const SizedBox(height: 12),
          _ErrorBanner(message: controller.error!),
        ],
        const SizedBox(height: 12),
        if (wishCount == 0)
          const _Empty()
        else
          ...controller.wishes.map(
            (view) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: WishCard(view: view),
            ),
          ),
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
          '$count item${count == 1 ? '' : 's'} on the hunt',
          style: const TextStyle(color: PatientlyTheme.inkSoft, fontSize: 15),
        ),
        if (awaiting > 0) ...[
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(
              color: PatientlyTheme.accent,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$awaiting ready to buy',
              style: const TextStyle(
                color: Color(0xFF4A2C00),
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFBE9EC),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        message,
        style: const TextStyle(color: PatientlyTheme.danger),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48, horizontal: 8),
      child: Column(
        children: [
          Text(
            'Nothing on the hunt yet.',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
          SizedBox(height: 8),
          Text(
            "Add something you want in the next 3–6 months. We'll quietly track "
            "the price across stores and ping you when it's the right time to buy.",
            textAlign: TextAlign.center,
            style: TextStyle(color: PatientlyTheme.inkSoft, height: 1.5),
          ),
        ],
      ),
    );
  }
}
