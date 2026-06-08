/// App-wide configuration.
///
/// The API base URL is compile-time configurable so the same build points at
/// local dev, staging or prod:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000   # Android emulator
///   flutter run --dart-define=API_BASE_URL=http://localhost:4000  # iOS sim / web / desktop
///
/// (Android emulators reach the host machine via 10.0.2.2, not localhost.)
class AppConfig {
  const AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000',
  );
}
