# ============================================================
# Balloo Messenger — ProGuard Rules (Android)
# ============================================================
# ВНИМАНИЕ: Этот файл вступает в силу после выполнения:
#   npx expo prebuild --platform android
# ============================================================

# Keep React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep Expo
-keep class expo.** { *; }

# Keep WebSocket
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep our models (serialization)
-keep class su.balloo.messenger.** { *; }

# Keep network requests
-keepattributes Signature
-keepattributes *Annotation*

# Keep Gson/JSON
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Keep WebView
-keep class android.webkit.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}