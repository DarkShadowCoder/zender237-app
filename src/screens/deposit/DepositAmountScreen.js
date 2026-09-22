import React, {
  useMemo,
  useState,
} from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
  spacing,
  typography,
  countries,
} from '../../theme/theme';

import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  isValidAmount,
} from '../../utils/validators';

function formatAmount(value) {
  const digits =
    String(value || '')
      .replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return digits.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ' '
  );
}

function normalizeAmount(value) {
  const digits =
    String(value || '')
      .replace(/\D/g, '');

  return digits
    ? Number(digits)
    : 0;
}

export default function DepositAmountScreen({
  navigation,
}) {
  const {
    profile,
  } = useAuth();

  const [
    amount,
    setAmount,
  ] = useState('');

  const [
    errors,
    setErrors,
  ] = useState({});

  const senderCountry =
    useMemo(
      () =>
        profile?.country &&
        countries[profile.country]
          ? profile.country
          : 'cameroun',
      [profile?.country]
    );

  const senderCountryLabel =
    countries[senderCountry]?.label ||
    'votre pays';

  const clearError =
    (field) => {
      if (!errors[field]) {
        return;
      }

      setErrors(
        (current) => ({
          ...current,
          [field]: null,
        })
      );
    };

  const handleContinue =
    () => {
      const nextErrors =
        {};

      if (
        !isValidAmount(
          amount
        )
      ) {
        nextErrors.amount =
          'Montant invalide.';
      }

      if (
        !profile?.whatsapp_number
      ) {
        nextErrors.identity =
          'Votre numéro WhatsApp est introuvable dans votre profil. Veuillez vous reconnecter.';
      }

      if (
        Object.keys(
          nextErrors
        ).length > 0
      ) {
        setErrors(
          nextErrors
        );

        return;
      }

      navigation.navigate(
        'DepositNumber',
        {
          amount:
            normalizeAmount(
              amount
            ),
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
        title="Nouveau dépôt"
      />

      <Text
        style={[
          typography.body,
          {
            marginTop:
              spacing.lg,

            marginBottom:
              spacing.xl,
          },
        ]}
      >
        Entrez les informations
        du dépôt
      </Text>

      <Input
        label="Montant"
        value={amount}
        onChangeText={(value) => {
          setAmount(
            formatAmount(
              value
            )
          );

          clearError(
            'amount'
          );
        }}
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
        error={
          errors.amount
        }
      />

      <View
        style={
          styles.identityCard
        }
      >
        <View
          style={
            styles.identityIcon
          }
        >
          <Text
            style={
              styles.identityIconText
            }
          >
            ✓
          </Text>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.identityTitle
            }
          >
            Numéro de l'expéditeur
          </Text>

          <Text
            style={
              styles.identityValue
            }
            numberOfLines={1}
          >
            {profile?.whatsapp_number ||
              'Numéro indisponible'}
          </Text>

          <Text
            style={
              styles.identityHelper
            }
          >
            Ce numéro est automatiquement utilisé pour le dépôt. Il ne peut pas être modifié ici.
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.countryHint
        }
      >
        Pays associé au numéro :{' '}
        {countries[senderCountry]?.flag}{' '}
        {senderCountryLabel}
      </Text>

      {errors.identity ? (
        <Text
          style={
            styles.errorText
          }
        >
          {errors.identity}
        </Text>
      ) : null}

      <View
        style={{
          marginTop:
            spacing.giant,
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

    identityCard: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap:
        spacing.sm,

      marginTop:
        spacing.md,

      padding:
        spacing.md,

      backgroundColor:
        colors.background
          .surface,

      borderWidth:
        1,

      borderColor:
        colors.border
          .light,

      borderRadius:
        12,
    },

    identityIcon: {
      width:
        32,

      height:
        32,

      borderRadius:
        16,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        colors.brand
          .primaryLight,
    },

    identityIconText: {
      color:
        colors.brand
          .primary,

      fontSize: 16,

      fontWeight:
        '800',
    },

    identityTitle: {
      ...typography.caption,

      color:
        colors.text.secondary,
    },

    identityValue: {
      ...typography.body,

      marginTop:
        spacing.xxs,

      fontWeight:
        '700',

      color:
        colors.text.primary,
    },

    identityHelper: {
      ...typography.caption,

      marginTop:
        spacing.xxs,

      color:
        colors.text.tertiary,

      lineHeight:
        spacing.md * 1.45,
    },

    countryHint: {
      ...typography.caption,

      marginTop:
        spacing.xs,

      color:
        colors.text.secondary,
    },

    errorText: {
      ...typography.caption,

      marginTop:
        spacing.xs,

      color:
        colors.error.default,
    },
  });
