
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import {
  colors,
  typography,
  spacing,
} from '../../theme/theme';

import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';

import {
  useWallet,
} from '../../context/WalletContext';

import {
  formatAmount,
} from '../../utils/formatters';

import {
  isValidAmount,
} from '../../utils/validators';

/**
 * Écran 25 — Retrait Étape 1 : montant.
 *
 * Formatage du montant :
 *   5000      -> 5 000
 *   50000     -> 50 000
 *   1250000   -> 1 250 000
 *
 * Le formatage est uniquement visuel.
 * Avant les calculs et la navigation,
 * le montant est converti en Number.
 */

function formatPrice(value) {
  if (!value) {
    return '';
  }

  // Garder uniquement les chiffres
  const digits =
    String(value).replace(
      /\D/g,
      ''
    );

  if (!digits) {
    return '';
  }

  // Ajouter un espace tous les 3 chiffres
  return digits.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ' '
  );
}

function normalizePrice(value) {
  const digits =
    String(value || '').replace(
      /\D/g,
      ''
    );

  return digits
    ? Number(digits)
    : 0;
}

export default function WithdrawalAmountScreen({
  navigation,
}) {
  const {
    wallet,
  } = useWallet();

  const [
    amount,
    setAmount,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState(null);

  /*
   * Le montant réellement utilisé
   * par l'application.
   *
   * Exemple :
   * "50 000" -> 50000
   */
  const numericAmount =
    normalizePrice(
      amount
    );

  /*
   * Frais de retrait : 2 %
   */
  const feeAmount =
    numericAmount
      ? Math.round(
          numericAmount *
            0.02
        )
      : 0;

  const handleAmountChange =
    (text) => {
      /*
       * Reformate automatiquement
       * le montant pendant la saisie.
       *
       * 5000 -> 5 000
       */
      const formatted =
        formatPrice(
          text
        );

      setAmount(
        formatted
      );

      /*
       * Supprimer l'erreur dès
       * que l'utilisateur modifie
       * le montant.
       */
      if (error) {
        setError(
          null
        );
      }
    };

  const handleContinue =
    () => {
      /*
       * Validation du montant.
       *
       * isValidAmount accepte le
       * format avec espaces.
       */
      if (
        !isValidAmount(
          amount
        )
      ) {
        setError(
          'Montant invalide.'
        );

        return;
      }

      /*
       * Vérification du solde.
       */
      if (
        numericAmount +
          feeAmount >
        wallet.available_balance
      ) {
        setError(
          'Solde disponible insuffisant.'
        );

        return;
      }

      /*
       * On transmet un nombre pur
       * à l'écran suivant.
       *
       * Exemple :
       * "50 000" -> 50000
       */
      navigation.navigate(
        'WithdrawalMethod',
        {
          amount:
            numericAmount,

          feeAmount:
            feeAmount,
        }
      );
    };

  return (
    <ScrollView
      style={
        styles.wrapper
      }
      contentContainerStyle={{
        padding:
          spacing.screenHorizontal,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Header
        title="Nouveau retrait"
      />

      <Text
        style={[
          typography.caption,
          {
            marginTop:
              spacing.lg,
          },
        ]}
      >
        Solde disponible
      </Text>

      <Text
        style={[
          typography.h2,
          {
            marginBottom:
              spacing.xl,
          },
        ]}
      >
        {formatAmount(
          wallet.available_balance
        )}
      </Text>

      <Input
        label="Montant à retirer"
        value={amount}
        onChangeText={
          handleAmountChange
        }
        keyboardType="number-pad"
        placeholder="50 000"
        rightAdornment={
          <Text
            style={
              typography.caption
            }
          >
            U
          </Text>
        }
        error={error}
      />

      {amount ? (
        <Text
          style={
            typography.caption
          }
        >
          Frais estimés :{' '}
          {formatAmount(
            feeAmount
          )}
        </Text>
      ) : null}

      <View
        style={{
          marginTop:
            spacing.xl,
        }}
      >
        <Button
          title="Continuer"
          onPress={
            handleContinue
          }
        />
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor:
        colors.background
          .default,
    },
  });

