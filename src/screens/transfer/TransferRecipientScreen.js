import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import {
  colors,
  typography,
  spacing,
  countries,
} from '../../theme/theme';

import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import PhoneNumberInput from '../../components/PhoneNumberInput';
import InfoBanner from '../../components/InfoBanner';

import {
  getTransferFee,
} from '../../services/feeService';

import {
  isValidTransferAmount,
  isValidRecipientName,
} from '../../utils/validators';

import {
  normalizePrice,
} from '../../components/Input';

import {
  buildInternationalPhone,
  digitsOnlyPhone,
} from '../../utils/phone';

const FEE_DEBOUNCE_MS = 400;

export default function TransferRecipientScreen({
  route,
  navigation,
}) {
  const {
    country,
    method,
    fromCountry,
  } = route.params;

  const [
    amount,
    setAmount,
  ] = useState('');

  const [
    fullName,
    setFullName,
  ] = useState('');

  const [
    mobileNumber,
    setMobileNumber,
  ] = useState('');

  const [
    location,
    setLocation,
  ] = useState('');

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    feeAmount,
    setFeeAmount,
  ] = useState(null);

  const [
    feeLoading,
    setFeeLoading,
  ] = useState(false);

  const [
    feeError,
    setFeeError,
  ] = useState(null);

  useEffect(() => {
    if (
      !isValidTransferAmount(
        amount
      )
    ) {
      setFeeAmount(null);
      setFeeError(null);

      return undefined;
    }

    let cancelled = false;

    setFeeLoading(true);
    setFeeError(null);

    const timer = setTimeout(() => {
      getTransferFee({
        fromCountry,
        toCountry: country,
        amount: normalizePrice(
          amount
        ),
      })
        .then((fee) => {
          if (cancelled) {
            return;
          }

          const normalizedFee =
            Number(fee);

          if (
            fee === null ||
            fee === undefined ||
            Number.isNaN(
              normalizedFee
            ) ||
            normalizedFee < 0
          ) {
            setFeeAmount(null);

            setFeeError(
              'Aucun frais défini pour ce montant sur ce Frais (maximum 1 000 000 U).'
            );
          } else {
            setFeeAmount(
              normalizedFee
            );
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setFeeError(
              e.message
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setFeeLoading(false);
          }
        });
    }, FEE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    amount,
    fromCountry,
    country,
  ]);

  const handleContinue =
    () => {
      const nextErrors = {};

      if (!fromCountry) {
        nextErrors.amount =
          'Le pays de départ n’a pas pu être déterminé.';
      }

      if (
        fromCountry === country
      ) {
        nextErrors.amount =
          'Le pays de départ et le pays de destination doivent être différents.';
      }

      if (
        !isValidTransferAmount(
          amount
        )
      ) {
        nextErrors.amount =
          'Montant invalide (entre 100 et 1 000 000 U).';
      }

      if (
        !isValidRecipientName(
          fullName
        )
      ) {
        nextErrors.fullName =
          'Nom du destinataire requis.';
      }

      if (
        digitsOnlyPhone(
          mobileNumber
        ).length < 8
      ) {
        nextErrors.mobileNumber =
          'Numéro Mobile Money requis.';
      }

      if (
        (
          feeAmount === null ||
          feeAmount === undefined
        ) &&
        !nextErrors.amount
      ) {
        nextErrors.amount =
          feeError ??
          'Frais indisponible pour ce montant.';
      }

      setErrors(
        nextErrors
      );

      if (
        Object.keys(
          nextErrors
        ).length
      ) {
        return;
      }

      navigation.navigate(
        'TransferSummary',
        {
          country,
          method,

          amount:
            normalizePrice(
              amount
            ),

          feeAmount,

          recipientName:
            fullName,

          recipientMobileNumber:
            buildInternationalPhone(
              mobileNumber,
              country
            ),

          recipientCountryCode:
            countries[
              country
            ].dialCode,

          recipientLocation:
            location,

          recipientCountry:
            country,

          fromCountry,
        }
      );
    };

  const canContinue =
    !feeLoading &&
    feeAmount !== null &&
    feeAmount !== undefined &&
    feeAmount >= 0 &&
    !errors.fullName &&
    !errors.mobileNumber;

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
        title="Destinataire"
      />

      <View
        style={
          styles.originInfo
        }
      >
        <Text
          style={
            styles.originInfoLabel
          }
        >
          Pays de départ détecté
        </Text>

        <Text
          style={
            styles.originInfoValue
          }
        >
          {countries[fromCountry]?.flag}{' '}
          {countries[fromCountry]?.label || fromCountry || '—'}
        </Text>
      </View>

      <Text
        style={[
          typography.body,
          {
            marginTop:
              spacing.lg,
            marginBottom:
              spacing.xl,
            lineHeight:
              spacing.md * 1.8,
          },
        ]}
      >
        Informations du
        destinataire — vers{' '}
        {
          countries[
            country
          ].flag
        }{' '}
        {
          countries[
            country
          ].label
        }
      </Text>

      <Input
        label="Montant"
        value={amount}
        onChangeText={
          setAmount
        }
        format="price"
        placeholder="100 000"
        error={
          errors.amount
        }
      />

      <View
        style={
          styles.feeRow
        }
      >
        {feeLoading ? (
          <ActivityIndicator
            size="small"
            color={
              colors.brand
                .primary
            }
          />
        ) : feeAmount !== null ? (
          <Text
            style={[
              typography.caption,
              {
                color:
                  colors.text
                    .secondary,
              },
            ]}
          >
            Frais :{' '}
            {feeAmount.toLocaleString(
              'fr-FR'
            )}{' '}
            U · Total :{' '}
            {(
              normalizePrice(
                amount
              ) +
              feeAmount
            ).toLocaleString(
              'fr-FR'
            )}{' '}
            U
          </Text>
        ) : feeError ? (
          <Text
            style={[
              typography.caption,
              {
                color:
                  colors.error
                    .default,
              },
            ]}
          >
            {feeError}
          </Text>
        ) : null}
      </View>

      <Input
        label="Nom complet"
        value={fullName}
        onChangeText={
          setFullName
        }
        placeholder="Mamadou Traoré"
        error={
          errors.fullName
        }
      />

      <PhoneNumberInput
        label="Numéro Mobile Money"
        value={mobileNumber}
        country={country}
        onChangeText={(value) => {
          setMobileNumber(value);

          if (
            errors.mobileNumber
          ) {
            setErrors(
              (current) => ({
                ...current,
                mobileNumber:
                  null,
              })
            );
          }
        }}
        error={
          errors.mobileNumber
        }
      />

      <Input
        label="Localisation"
        value={location}
        onChangeText={
          setLocation
        }
        placeholder="Bamako, Mali"
      />

      <InfoBanner
        text="Vérifiez que le numéro saisi est correct avant de continuer."
        icon="alert-circle-outline"
      />

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
          disabled={
            !canContinue
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

    originInfo: {
      marginBottom: spacing.md,
      padding: spacing.sm,
      backgroundColor: colors.background.surface,
      borderWidth: 1,
      borderColor: colors.brand.primaryLight,
      borderRadius: 12,
    },

    originInfoLabel: {
      ...typography.caption,
      color: colors.text.secondary,
    },

    originInfoValue: {
      ...typography.body,
      marginTop: spacing.xxs,
      color: colors.text.primary,
      fontWeight: '700',
    },

    feeRow: {
      minHeight: 20,

      marginTop:
        -spacing.sm,

      marginBottom:
        spacing.md,
    },
  });