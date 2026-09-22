import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../theme/theme';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { submitDepositProof, uploadProofImage } from '../../services/transactionService';
import { useAuth } from '../../context/AuthContext';

/**
 * Écran 15 — Recharge Étape 3 : envoi de la preuve (capture d'écran/image).
 *
 * Cahier des charges, section 2.3.1 étapes 3-4 :
 *   « Charge le conteneur qui nécessite une capture d'écran ou une
 *     image de la transaction, et une référence de transaction
 *     (facultative). [...] Envoie la preuve à la base de données.
 *     Notifie l'administrateur et le(s) partenaire(s) [...] Ajoute
 *     le montant du dépôt non vérifié au solde en attente. »
 * -> une fois la preuve soumise, la transaction passe à `under_review`
 * (jamais directement `confirmed`) : on redirige donc vers l'écran 16
 * « Recharge en attente », pas vers un écran de statut final générique.
 */
export default function DepositProofScreen({ route, navigation }) {
  const { transactionId } = route.params;
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [referenceNote, setReferenceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission requise pour accéder aux photos.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!image) {
      Toast.show({ type: 'error', text1: 'Ajoutez une image de la transaction.' });
      return;
    }
    setSubmitting(true);
    try {
      const fileUrl = await uploadProofImage({
        uri: image.uri,
        fileName: `proof-${Date.now()}.jpg`,
        contentType: 'image/jpeg',
        transactionId,
      });
      await submitDepositProof({ transactionId, userId: user.id, fileUrl, referenceNote });
      // Après soumission de la preuve, la transaction passe en
      // "under_review" (étape 4) — écran 16 "Recharge en attente",
      // pas un écran de statut générique inexistant.
      navigation.replace('DepositStatus', { transactionId });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ padding: spacing.screenHorizontal }}>
      <Header title="Envoyer la preuve" />
      <Text style={[typography.body, { marginTop: spacing.lg, marginBottom: spacing.lg }]}>
        Téléversez la capture d'écran du paiement effectué.
      </Text>

      <Pressable style={styles.dropzone} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.preview} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.icon.active} />
            <Text style={[typography.bodyBold, { color: colors.brand.primary }]}>Ajouter une image</Text>
            <Text style={typography.caption}>Formats acceptés : JPG, PNG, PDF (max 5Mo)</Text>
          </>
        )}
      </Pressable>

      <Input
        label="Note (optionnelle)"
        value={referenceNote}
        onChangeText={setReferenceNote}
        placeholder="Référence de transaction"
      />

      <View style={{ marginTop: spacing.lg }}>
        <Button title="Soumettre le dépôt" onPress={handleSubmit} loading={submitting} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background.default },
  dropzone: {
    minHeight: 200,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    backgroundColor: colors.background.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: 300 },
});