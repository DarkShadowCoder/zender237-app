
import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Toast from 'react-native-toast-message';

import {
  colors,
  typography,
  spacing,
  countries,
  paymentMethods,
} from '../../theme/theme';

import Header from '../../components/Header';
import SelectField from '../../components/SelectField';
import Button from '../../components/Button';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  detectAndPersistCurrentCountry,
} from '../../services/locationService';

const methodOrder =
  Object.keys(
    paymentMethods
  );

const DESTINATION_COUNTRIES = [
  'mali',
  'guinee',
  'cameroun'
];

/**
 * Écran 20 — Transfert Étape 1 :
 * pays de destination + méthode.
 *
 * Le pays de destination est limité
 * aux destinations demandées :
 * Mali, Guinée et Cameroun.
 */
export default function TransferDestinationScreen({
  navigation,
}) {
  const {
    user,
  } = useAuth();

  const [
    senderCountry,
    setSenderCountry,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(null);

  const [
    country,
    setCountry,
  ] = useState(
    DESTINATION_COUNTRIES[0]
  );

  const [
    method,
    setMethod,
  ] = useState(
    methodOrder[1]
  );

  const [
    countryDropdownOpen,
    setCountryDropdownOpen,
  ] = useState(false);

  useEffect(() => {
    let cancelled =
      false;

    const loadCountry =
      async () => {
        setLoading(true);
        setLoadError(null);

        try {
          if (!user?.id) {
            throw new Error(
              'Session utilisateur introuvable. Reconnectez-vous avant de faire un transfert.'
            );
          }

          const detected =
            await detectAndPersistCurrentCountry({
              userId: user.id,
            });

          const fromCountry =
            detected.country;

          if (!fromCountry) {
            throw new Error(
              "Impossible de déterminer votre pays actuel."
            );
          }

          if (
            DESTINATION_COUNTRIES.length > 0 &&
            DESTINATION_COUNTRIES.includes(fromCountry)
          ) {
            setCountry(
              DESTINATION_COUNTRIES.find(
                (item) => item !== fromCountry
              ) || DESTINATION_COUNTRIES[0]
            );
          }

          if (cancelled) {
            return;
          }

          setSenderCountry(
            fromCountry
          );
        } catch (e) {
          if (!cancelled) {
            setLoadError(
              e.message
            );

            Toast.show({
              type:
                'error',
              text1:
                'Erreur',
              text2:
                e.message,
            });
          }
        } finally {
          if (!cancelled) {
            setLoading(
              false
            );
          }
        }
      };

    loadCountry();

    return () => {
      cancelled = true;
    };
  }, [
    user?.country,
  ]);

  const selectCountry =
    (destinationCountry) => {
      setCountry(
        destinationCountry
      );

      setCountryDropdownOpen(
        false
      );
    };

  const cycleMethod =
    () => {
      const idx =
        methodOrder.indexOf(
          method
        );

      setMethod(
        methodOrder[
          (idx + 1) %
            methodOrder.length
        ]
      );
    };

  const selectedCountry =
    countries[
      country
    ];

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
        title="Nouveau transfert"
      />

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
        Entrez les informations
        du transfert
      </Text>

      {loading ? (
        <ActivityIndicator
          color={
            colors.brand
              .primary
          }
          style={{
            marginVertical:
              spacing.xl,
          }}
        />
      ) : loadError ? (
        <Text
          style={[
            typography.body,
            {
              color:
                colors.error
                  .default,
            },
          ]}
        >
          {loadError}
        </Text>
      ) : (
        <>
          <View
            style={
              styles.detectedCountryCard
            }
          >
            <View
              style={
                styles.detectedCountryIcon
              }
            >
              <Text
                style={
                  styles.detectedCountryIconText
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
                  styles.detectedCountryTitle
                }
              >
                Pays de départ détecté
              </Text>

              <Text
                style={
                  styles.detectedCountryValue
                }
              >
                {countries[senderCountry]?.flag}{' '}
                {countries[senderCountry]?.label || senderCountry}
              </Text>

              <Text
                style={
                  styles.detectedCountryHelper
                }
              >
                La localisation de votre téléphone est utilisée pour appliquer le tarif correspondant.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.countryFieldContainer
            }
          >
            <SelectField
              label="Pays de destination"
              valueLabel={
                selectedCountry
                  ? `${selectedCountry.flag} ${selectedCountry.label}`
                  : 'Sélectionner'
              }
              onPress={() =>
                setCountryDropdownOpen(
                  (current) =>
                    !current
                )
              }
            />

            {countryDropdownOpen ? (
              <View
                style={
                  styles.dropdown
                }
              >
                {DESTINATION_COUNTRIES.map(
                  (
                    destinationCountry
                  ) => {
                    const item =
                      countries[
                        destinationCountry
                      ];

                    const selected =
                      destinationCountry ===
                      country;

                    return (
                      <Pressable
                        key={
                          destinationCountry
                        }
                        onPress={() =>
                          selectCountry(
                            destinationCountry
                          )
                        }
                        style={[
                          styles.dropdownItem,
                          selected &&
                            styles.dropdownItemSelected,
                        ]}
                      >
                        <Text
                          style={
                            styles.dropdownFlag
                          }
                        >
                          {
                            item.flag
                          }
                        </Text>

                        <Text
                          style={[
                            typography.caption,
                            styles.dropdownText,
                            selected &&
                              styles.dropdownTextSelected,
                          ]}
                        >
                          {
                            item.label
                          }
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            ) : null}
          </View>

          <SelectField
            label="Méthode"
            valueLabel={
              paymentMethods[
                method
              ].label
            }
            onPress={
              cycleMethod
            }
          />
        </>
      )}

      <View
        style={{
          marginTop:
            spacing.xl,
        }}
      >
        <Button
          title="Continuer"
          disabled={
            loading ||
            !country
          }
          onPress={() =>
            navigation.navigate(
              'TransferRecipient',
              {
                country,
                method,
                fromCountry:
                  senderCountry,
              }
            )
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

    detectedCountryCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.background.surface,
      borderWidth: 1,
      borderColor: colors.brand.primaryLight,
      borderRadius: 12,
    },

    detectedCountryIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.brand.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    detectedCountryIconText: {
      color: colors.brand.primary,
      fontSize: 15,
      fontWeight: '800',
    },

    detectedCountryTitle: {
      ...typography.caption,
      color: colors.text.secondary,
    },

    detectedCountryValue: {
      ...typography.body,
      marginTop: spacing.xxs,
      color: colors.text.primary,
      fontWeight: '700',
    },

    detectedCountryHelper: {
      ...typography.caption,
      marginTop: spacing.xxs,
      color: colors.text.tertiary,
      lineHeight: spacing.md * 1.4,
    },

    countryFieldContainer: {
      position:
        'relative',

      zIndex:
        100,
    },

    dropdown: {
      position:
        'absolute',

      top:
        78,

      left:
        0,

      right:
        0,

      zIndex:
        1000,

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

      overflow:
        'hidden',

      shadowColor:
        '#000',

      shadowOpacity:
        0.08,

      shadowRadius:
        8,

      shadowOffset: {
        width:
          0,

        height:
          3,
      },

      elevation:
        4,
    },

    dropdownItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        spacing.md,

      paddingVertical:
        spacing.md,

      minHeight:
        52,

      backgroundColor:
        colors.background
          .surface,

      borderBottomWidth:
        1,

      borderBottomColor:
        colors.border
          .light,
    },

    dropdownItemSelected: {
      backgroundColor:
        colors.brand
          .primaryLight,
    },

    dropdownFlag: {
      fontSize:
        22,

      marginRight:
        spacing.sm,
    },

    dropdownText: {
      flex:
        1,

      color:
        colors.text.primary,
    },

    dropdownTextSelected: {
      color:
        colors.brand
          .primaryDark,

      fontWeight:
        '700',
    },
  });
