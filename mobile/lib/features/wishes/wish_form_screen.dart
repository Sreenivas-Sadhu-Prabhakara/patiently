import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../data/enums.dart';
import '../../data/models.dart';
import '../../state/wishes_controller.dart';

/// Capture a new wish: the "what I want in 3–6 months" intent.
class WishFormScreen extends StatefulWidget {
  const WishFormScreen({super.key});

  @override
  State<WishFormScreen> createState() => _WishFormScreenState();
}

class _WishFormScreenState extends State<WishFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _title = TextEditingController();
  final TextEditingController _brand = TextEditingController();
  final TextEditingController _budget = TextEditingController();

  int _months = 4;
  ItemCondition _condition = ItemCondition.newItem;
  final Set<StoreId> _stores = <StoreId>{};
  bool _busy = false;

  @override
  void dispose() {
    _title.dispose();
    _brand.dispose();
    _budget.dispose();
    super.dispose();
  }

  DateTime _horizon() {
    final DateTime now = DateTime.now();
    return DateTime(
      now.year,
      now.month + _months,
      now.day,
      now.hour,
      now.minute,
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final WishesController controller = context.read<WishesController>();
    final NavigatorState navigator = Navigator.of(context);
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);

    final int? budgetCents = _budget.text.trim().isEmpty
        ? null
        : (double.parse(_budget.text.trim()) * 100).round();

    final CreateWishInput input = CreateWishInput(
      title: _title.text.trim(),
      desiredByDate: _horizon(),
      condition: _condition,
      allowedStores: _stores.toList(),
      brand: _brand.text.trim().isEmpty ? null : _brand.text.trim(),
      maxBudgetCents: budgetCents,
    );

    setState(() => _busy = true);
    final bool ok = await controller.createWish(input);
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      navigator.pop();
    } else {
      messenger.showSnackBar(
        SnackBar(content: Text(controller.error ?? 'Could not save the wish.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('What do you want?')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 22, 24, 44),
          children: [
            TextFormField(
              controller: _title,
              style: const TextStyle(color: PatientlyTheme.ink),
              decoration: const InputDecoration(
                labelText: 'ITEM',
                hintText: 'e.g. Sony WH-1000XM5 headphones',
              ),
              validator: (v) => (v == null || v.trim().length < 2)
                  ? 'Tell us what you want'
                  : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _brand,
                    style: const TextStyle(color: PatientlyTheme.ink),
                    decoration: const InputDecoration(
                      labelText: 'BRAND (OPTIONAL)',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _budget,
                    style: const TextStyle(color: PatientlyTheme.ink),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'MAX BUDGET (₹)',
                      hintText: '26990',
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return null;
                      return double.tryParse(v.trim()) == null
                          ? 'Enter a number'
                          : null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<int>(
                    initialValue: _months,
                    dropdownColor: PatientlyTheme.surface,
                    style: const TextStyle(
                      color: PatientlyTheme.ink,
                      fontSize: 15,
                    ),
                    decoration: const InputDecoration(labelText: 'WITHIN'),
                    items: const [3, 4, 5, 6]
                        .map(
                          (m) => DropdownMenuItem(
                            value: m,
                            child: Text('$m months'),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setState(() => _months = v ?? 4),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<ItemCondition>(
                    initialValue: _condition,
                    dropdownColor: PatientlyTheme.surface,
                    style: const TextStyle(
                      color: PatientlyTheme.ink,
                      fontSize: 15,
                    ),
                    decoration: const InputDecoration(labelText: 'CONDITION'),
                    items: ItemCondition.values
                        .map(
                          (c) =>
                              DropdownMenuItem(value: c, child: Text(c.label)),
                        )
                        .toList(),
                    onChanged: (v) =>
                        setState(() => _condition = v ?? ItemCondition.newItem),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 26),
            Text(
              'BUY FROM — LEAVE EMPTY FOR ALL STORES',
              style: PatientlyTheme.label(
                size: 10,
                color: PatientlyTheme.inkFaint,
                tracking: 1.6,
              ),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: StoreId.values.map((s) {
                final bool on = _stores.contains(s);
                return FilterChip(
                  label: Text(s.label),
                  selected: on,
                  onSelected: (_) => setState(() {
                    if (on) {
                      _stores.remove(s);
                    } else {
                      _stores.add(s);
                    }
                  }),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(_busy ? 'SAVING…' : 'START HUNTING'),
            ),
          ],
        ),
      ),
    );
  }
}
