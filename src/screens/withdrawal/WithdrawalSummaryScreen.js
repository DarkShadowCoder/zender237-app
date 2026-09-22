import React, {
  useState,
} from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Toast from
  'react-native-toast-message';

import {
  colors,
  radii,
  spacing,
  typography,
} from '../../theme/theme';

import Header from
  '../../components/Header';

import Button from
  '../../components/Button';

import AmountDisplay from
  '../../components/AmountDisplay';

import {
  createWithdrawal,
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

const METHOD_LABELS = {
  mobile_money:
    'Mobile Money',

  bank_transfer:
    'Compte bancaire',

  partner_agent:
    'Retrait partenaire',
};

export default function WithdrawalSummaryScreen({
  route,
  navigation,
}) {
  const {
    amount,
    feeAmount,
    method,
    recipientName,
    recipientMobileNumber,
    recipientCountryCode,
  } = route.params;

  const {
    user,
  } = useAuth();

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const numericAmount =
    Number(amount);

  const numericFee =
    Number(
      feeAmount || 0
    );

  const youReceive =
    numericAmount -
    numericFee;

  const isPhoneMethod =
    method !==
    'bank_transfer';

  const normalizedPhone =
    isPhoneMethod
      ? normalizeInternationalPhone(
          recipientMobileNumber
        )
      : recipientMobileNumber;

  const resolvedCountryCode =
    isPhoneMethod
      ? recipientCountryCode ||
        getCountryCodeFromPhone(
          normalizedPhone
        )
      : null;

  const handleConfirm =
    async () => {
      setSubmitting(
        true
      );

      try {
        const txn =
          await createWithdrawal({
            userId:
              user.id,

            amount:
              numericAmount,

            feeAmount:
              numericFee,

            recipientMobileNumber:
              normalizedPhone,

            recipientCountryCode:
              resolvedCountryCode,

            recipientName,

            method:
              METHOD_LABELS[
                method
              ],
          });

        navigation.replace(
          'WithdrawalStatus',
          {
            transactionId:
              txn.id,
          }
        );
      } catch (
        error
      ) {
        Toast.show({
          type:
            'error',

          text1:
            'Erreur',

          text2:
            error?.message ||
            'Impossible de créer le retrait.',
        });
      } finally {
        setSubmitting(
          false
        );
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
        title="Résumé du retrait"
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
          label="Bénéficiaire"
          value={
            recipientName ||
            '—'
          }
        />

        <Row
          label={
            isPhoneMethod
              ? 'Numéro'
              : 'Compte'
          }
          value={
            isPhoneMethod
              ? formatPhone(
                  normalizedPhone
                ) || '—'
              : normalizedPhone ||
                '—'
          }
        />

        {resolvedCountryCode ? (
          <Row
            label="Indicatif"
            value={
              resolvedCountryCode
            }
          />
        ) : null}

        <Row
          label="Méthode"
          value={
            METHOD_LABELS[
              method
            ]
          }
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
          label="Montant"
          value={
            numericAmount
          }
        />

        <AmountDisplay
          label="Frais"
          value={
            numericFee
          }
        />

        <View
          style={
            styles.divider
          }
        />

        <AmountDisplay
          label="Vous recevez"
          value={
            youReceive
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
          title="Confirmer le retrait"
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
      style={
        styles.rowInfo
      }
    >
      <Text
        style={
          typography.caption
        }
      >
        {label}
      </Text>

      <Text
        style={
          typography.bodyBold
        }
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

    rowInfo: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      marginBottom:
        spacing.sm,

      gap:
        spacing.md,
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