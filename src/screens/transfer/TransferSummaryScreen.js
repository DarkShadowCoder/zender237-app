import React, {
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import Toast from
  'react-native-toast-message';

import {
  colors,
  typography,
  spacing,
  radii,
  countries,
  paymentMethods,
} from '../../theme/theme';

import Header from
  '../../components/Header';

import Button from
  '../../components/Button';

import AmountDisplay from
  '../../components/AmountDisplay';

import {
  createTransfer,
} from '../../services/transactionService';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  formatPhone,
} from '../../components/Input';

import {
  getCountryCodeFromPhone,
  normalizeInternationalPhone,
} from '../../utils/phone';

export default function TransferSummaryScreen({
  route,
  navigation,
}) {
  const {
    country,
    method,
    amount,
    fromCountry,
    feeAmount,
    recipientName,
    recipientMobileNumber,
    recipientLocation,
    recipientCountry,
    recipientCountryCode,
  } = route.params;

  const {
    user,
  } = useAuth();

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const numericAmount =
    Number(amount);

  const numericFeeAmount =
    feeAmount === null ||
    feeAmount === undefined
      ? 0
      : Number(feeAmount);

  const total =
    numericAmount +
    numericFeeAmount;

  const handleConfirm =
    async () => {
      setSubmitting(true);

      try {
        const txn =
          await createTransfer({
            userId:
              user.id,

            amount:
              numericAmount,

            recipientName,

            recipientMobileNumber:
              normalizeInternationalPhone(
                recipientMobileNumber
              ),

            recipientCountryCode:
              recipientCountryCode ||
              getCountryCodeFromPhone(
                recipientMobileNumber
              ),

            recipientLocation,

            recipientCountry:
              recipientCountry ??
              country,

            referenceNote:
              `${countries[fromCountry]?.label || fromCountry} → ${countries[country]?.label || country} · ${paymentMethods[method].label}`,
          });

        navigation.replace(
          'TransferStatus',
          {
            transactionId:
              txn.id,
          }
        );
      } catch (e) {
        Toast.show({
          type:
            'error',

          text1:
            'Erreur',

          text2:
            e.message,
        });
      } finally {
        setSubmitting(false);
      }
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
    >
      <Header
        title="Résumé du transfert"
      />

      <Text
        style={[
          typography.body,
          {
            marginTop:
              spacing.lg,

            marginBottom:
              spacing.lg,
          },
        ]}
      >
        Vérifiez les
        informations
      </Text>

      <View
        style={
          styles.card
        }
      >
        <Row
          label="Destinataire"
          value={
            recipientName
          }
        />

        <Row
          label="Numéro Mobile Money"
          value={
            formatPhone(
              recipientMobileNumber
            )
          }
        />

        <Row
          label="Opérateur"
          value={
            paymentMethods[
              method
            ].label
          }
        />

        <Row
          label="Pays de départ"
          value={`${countries[fromCountry]?.flag || ''} ${countries[fromCountry]?.label || fromCountry || '—'}`}
        />

        <Row
          label="Pays de destination"
          value={`${countries[country].flag} ${countries[country].label}`}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            marginTop:
              spacing.lg,
          },
        ]}
      >
        <AmountDisplay
          label="Vous envoyez"
          value={
            numericAmount
          }
        />

        <AmountDisplay
          label="Frais"
          value={
            numericFeeAmount
          }
        />

        <View
          style={
            styles.divider
          }
        />

        <AmountDisplay
          label="Total"
          value={
            total
          }
          emphasize
        />
      </View>

      <View
        style={{
          marginTop:
            spacing.xl,
        }}
      >
        <Button
          title="Confirmer le transfert"
          onPress={
            handleConfirm
          }
          loading={
            submitting
          }
        />
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
}) {
  return (
    <View
      style={{
        flexDirection:
          'row',

        justifyContent:
          'space-between',

        marginBottom:
          spacing.sm,
      }}
    >
      <Text
        style={
          typography.caption
        }
      >
        {label}
      </Text>

      <Text
        style={[
          typography.caption,
          {
            maxWidth:
              250,
          },
        ]}
        numberOfLines={
          1
        }
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
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

    card: {
      backgroundColor:
        colors.background
          .surface,

      borderRadius:
        radii.md,

      borderWidth:
        1,

      borderColor:
        colors.border
          .light,

      padding:
        spacing.lg,
    },

    divider: {
      height:
        1,

      backgroundColor:
        colors.border
          .light,

      marginVertical:
        spacing.sm,
    },
  });