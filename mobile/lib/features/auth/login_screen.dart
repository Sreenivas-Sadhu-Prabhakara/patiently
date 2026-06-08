import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../state/auth_controller.dart';

/// Passwordless MVP sign-in, pre-filled with the seeded demo account.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _email = TextEditingController(
    text: 'demo@patiently.app',
  );
  final TextEditingController _name = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final AuthController auth = context.read<AuthController>();
    await auth.login(_email.text.trim(), _name.text.trim());
  }

  @override
  Widget build(BuildContext context) {
    final AuthController auth = context.watch<AuthController>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const _Brand(centered: true),
                      const SizedBox(height: 16),
                      const Text(
                        'Tell us what you want over the next 3–6 months. We hunt the '
                        'cheapest landed price across Amazon.in, Flipkart & more — and buy '
                        'it the moment you approve.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: PatientlyTheme.inkSoft,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 24),
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: 'Email'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _name,
                        decoration: const InputDecoration(
                          labelText: 'Name (optional)',
                        ),
                      ),
                      if (auth.error != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          auth.error!,
                          style: const TextStyle(color: PatientlyTheme.danger),
                        ),
                      ],
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: auth.busy ? null : _submit,
                        child: Text(auth.busy ? 'Signing in…' : 'Continue'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand({this.centered = false});
  final bool centered;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: centered
          ? MainAxisAlignment.center
          : MainAxisAlignment.start,
      children: const [
        Icon(Icons.schedule, color: PatientlyTheme.accent),
        SizedBox(width: 8),
        Text(
          'Patiently',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: PatientlyTheme.ink,
          ),
        ),
      ],
    );
  }
}
