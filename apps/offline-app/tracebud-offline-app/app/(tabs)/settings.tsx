import { StyleSheet, View, Button, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLanguage } from '@/features/state/LanguageContext';
import { getAuthCredentials, setAuthCredentials } from '@/features/api/postPlot';
import { useState } from 'react';

export default function SettingsScreen() {
  const { lang, setLang } = useLanguage();
  const initialAuth = getAuthCredentials();
  const [email, setEmail] = useState(initialAuth.email);
  const [password, setPassword] = useState(initialAuth.password);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle">Language / Idioma</ThemedText>
        <View style={styles.row}>
          <Button
            title="English"
            onPress={() => setLang('en')}
            disabled={lang === 'en'}
          />
          <Button
            title="Español"
            onPress={() => setLang('es')}
            disabled={lang === 'es'}
          />
        </View>
        <ThemedText>
          This only changes the texts inside the mobile app. Data stored in the
          backend is not translated.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Backend account (role)</ThemedText>
        <ThemedText>
          The email you use here determines the role on the backend (farmer, agent, exporter).
        </ThemedText>
        <ThemedText>Email</ThemedText>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <ThemedText>Password</ThemedText>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.row}>
          <Button
            title="Use this account"
            onPress={() => setAuthCredentials(email, password)}
          />
        </View>
        <ThemedText>
          Tip: use emails like <ThemedText>agent+demo@...</ThemedText> or
          <ThemedText>exporter+demo@...</ThemedText> in Supabase to try different roles.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

