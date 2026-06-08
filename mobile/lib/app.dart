import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'data/api_client.dart';
import 'data/auth_store.dart';
import 'features/auth/login_screen.dart';
import 'features/wishes/wishes_screen.dart';
import 'state/auth_controller.dart';
import 'state/wishes_controller.dart';

class PatientlyApp extends StatefulWidget {
  const PatientlyApp({super.key});

  @override
  State<PatientlyApp> createState() => _PatientlyAppState();
}

class _PatientlyAppState extends State<PatientlyApp> {
  // Created once for the app's lifetime.
  final ApiClient _api = ApiClient();
  final AuthStore _store = AuthStore();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: _api),
        ChangeNotifierProvider<AuthController>(
          create: (_) => AuthController(_api, _store)..restore(),
        ),
        ChangeNotifierProvider<WishesController>(
          create: (ctx) => WishesController(
            _api,
            onUnauthorized: () => ctx.read<AuthController>().logout(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'Patiently',
        debugShowCheckedModeBanner: false,
        theme: PatientlyTheme.light(),
        home: const _Gate(),
      ),
    );
  }
}

/// Shows the sign-in screen or the home screen based on session state.
class _Gate extends StatelessWidget {
  const _Gate();

  @override
  Widget build(BuildContext context) {
    final AuthController auth = context.watch<AuthController>();
    if (auth.booting) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return auth.signedIn ? const WishesScreen() : const LoginScreen();
  }
}
