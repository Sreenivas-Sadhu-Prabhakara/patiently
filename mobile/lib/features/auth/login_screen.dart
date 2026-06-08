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
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'INTENTIONAL BUYING · INDIA',
                    textAlign: TextAlign.center,
                    style: PatientlyTheme.label(
                      size: 10,
                      color: PatientlyTheme.gold,
                      tracking: 2.6,
                    ),
                  ),
                  const SizedBox(height: 18),
                  const _Brand(),
                  const SizedBox(height: 28),
                  Text(
                    "Want it for less? We'll wait for the right price.",
                    textAlign: TextAlign.center,
                    style: PatientlyTheme.serif(
                      size: 27,
                      weight: FontWeight.w300,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 38),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: PatientlyTheme.ink),
                    decoration: const InputDecoration(labelText: 'EMAIL'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _name,
                    style: const TextStyle(color: PatientlyTheme.ink),
                    decoration: const InputDecoration(
                      labelText: 'NAME (OPTIONAL)',
                    ),
                  ),
                  if (auth.error != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      auth.error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: PatientlyTheme.danger,
                        fontSize: 13,
                      ),
                    ),
                  ],
                  const SizedBox(height: 30),
                  FilledButton(
                    onPressed: auth.busy ? null : _submit,
                    child: Text(auth.busy ? 'ENTERING…' : 'ENTER'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.schedule, color: PatientlyTheme.gold, size: 17),
        const SizedBox(width: 9),
        Text(
          'Patiently',
          style: PatientlyTheme.serif(size: 25, weight: FontWeight.w500),
        ),
      ],
    );
  }
}
