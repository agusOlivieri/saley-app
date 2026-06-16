import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { useAuth } from "../../lib/AuthContext";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"username" | "email" | "password" | null>(null);

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleRegister = async () => {
    setError(null);

    // Basic Validations
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (username.trim().length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(
      email.trim(),
      password,
      username.trim()
    );

    if (signUpError) {
      setError(signUpError.message || "Ocurrió un error al registrar el usuario.");
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.brandName}>
              Crear Cuenta<Text style={styles.brandDot}>.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Únete a Saley y empieza a ahorrar encontrando las mejores ofertas.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#ff3b30" style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Username Input */}
            <Text style={styles.label}>Nombre de usuario</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "username" && styles.inputWrapperFocused,
              ]}
            >
              <User
                size={20}
                color={focusedField === "username" ? "#ff6b00" : "#8e8e93"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ejemplo123"
                placeholderTextColor="#a1a1a6"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email Input */}
            <Text style={styles.label}>Correo electrónico</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "email" && styles.inputWrapperFocused,
              ]}
            >
              <Mail
                size={20}
                color={focusedField === "email" ? "#ff6b00" : "#8e8e93"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="tu@correo.com"
                placeholderTextColor="#a1a1a6"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Password Input */}
            <Text style={styles.label}>Contraseña</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === "password" && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={20}
                color={focusedField === "password" ? "#ff6b00" : "#8e8e93"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#a1a1a6"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#8e8e93" />
                ) : (
                  <Eye size={20} color="#8e8e93" />
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
    justifyContent: "center",
  },
  headerContainer: {
    marginBottom: 35,
    alignItems: "flex-start",
  },
  brandName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#003366",
    letterSpacing: -1,
  },
  brandDot: {
    color: "#ff6b00",
  },
  subtitle: {
    fontSize: 15,
    color: "#48484a",
    marginTop: 10,
    lineHeight: 21,
  },
  formContainer: {
    width: "100%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffe5e5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    marginBottom: 20,
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: "#ff6b00",
    backgroundColor: "#ffffff",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#1c1c1e",
    fontSize: 16,
    height: "100%",
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    backgroundColor: "#003366",
    borderRadius: 12,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: "#8e8e93",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ff6b00",
  },
});
