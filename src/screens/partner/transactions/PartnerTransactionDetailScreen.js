import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  colors,
  typography,
  spacing,
} from '../../../theme/theme';

import {
  getTransaction,
  approveTransaction,
  rejectTransaction,
  confirmTransaction,
  executeTransaction,
  cancelTransaction,
} from '../../../services/partnerService';

import {
  useAuthorization,
} from '../../../context/AuthorizationContext';

import {
  formatAmount,
  formatDateTime,
} from '../../../utils/formatters';

import Card from
  '../../../components/Card';

import StatusBadge from
  '../../../components/StatusBadge';

import Button from
  '../../../components/Button';

import InfoBanner from
  '../../../components/InfoBanner';

import EmptyState from
  '../../../components/EmptyState';

export default function PartnerTransactionDetailScreen({
  route,
  navigation,
}) {
  const id =
    route?.params?.transactionId;

  const [
    data,
    setData,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(false);

  const {
    canConfirmTransaction,
    canApproveTransaction,
    canRejectTransaction,
    canExecuteTransaction,
    canCancelTransaction,
    isPartnerAdmin,
    isPartnerOperator,
  } = useAuthorization();

  const load =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setData(
            await getTransaction(
              id
            )
          );
        } catch (
          e
        ) {
          Alert.alert(
            'Erreur',
            e?.message ||
              'Impossible de charger la transaction.'
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [id]
    );

  useEffect(
    () => {
      load();
    },
    [load]
  );

  if (
    loading &&
    !data
  ) {
    return (
      <View
        style={{
          flex: 1,

          backgroundColor:
            colors.background
              .default,

          alignItems:
            'center',

          justifyContent:
            'center',
        }}
      >
        <Text
          style={
            typography.caption
          }
        >
          Chargement…
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View
        style={{
          flex: 1,

          backgroundColor:
            colors.background
              .default,

          alignItems:
            'center',

          justifyContent:
            'center',

          padding:
            spacing.screenHorizontal,
        }}
      >
        <EmptyState
          icon="lock-closed-outline"
          title="Transaction inaccessible"
          subtitle="Votre rôle ne permet pas de consulter cette transaction."
        />
      </View>
    );
  }

  const t =
    data.transaction ||
    data;

  const pending =
    [
      'pending_proof',
      'under_review',
      'pending',
    ].includes(
      t.status
    );

  const run =
    async (
      callback,
      successMessage
    ) => {
      try {
        setActionLoading(
          true
        );

        await callback();

        Alert.alert(
          'Opération réussie',
          successMessage
        );

        await load();
      } catch (
        e
      ) {
        Alert.alert(
          'Erreur',
          e?.message ||
            'Impossible d’appliquer cette action.'
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const confirm =
    () => {
      if (
        !canConfirmTransaction()
      ) {
        Alert.alert(
          'Action non autorisée',
          'Votre rôle ne permet pas de confirmer cette transaction.'
        );

        return;
      }

      Alert.alert(
        'Confirmer',
        'Confirmer cette transaction ?',
        [
          {
            text:
              'Annuler',
            style:
              'cancel',
          },

          {
            text:
              'Confirmer',

            onPress:
              () =>
                run(
                  () =>
                    confirmTransaction({
                      transactionId:
                        id,
                    }),

                  'La transaction a été confirmée.'
                ),
          },
        ]
      );
    };

  const approve =
    () => {
      if (
        !canApproveTransaction()
      ) {
        return;
      }

      run(
        () =>
          approveTransaction({
            transactionId:
              id,
          }),

        'La transaction a été approuvée.'
      );
    };

  const reject =
    () => {
      if (
        !canRejectTransaction()
      ) {
        Alert.alert(
          'Action non autorisée',
          'Le rôle Partner ne peut pas rejeter une transaction.'
        );

        return;
      }

      navigation.navigate(
        'PartnerTransactionReview',
        {
          transactionId:
            id,

          decision:
            'reject',

          transaction:
            data,
        }
      );
    };

  const execute =
    () => {
      if (
        !canExecuteTransaction()
      ) {
        Alert.alert(
          'Action non autorisée',
          'Seul le rôle Admin partenaire peut exécuter une transaction.'
        );

        return;
      }

      run(
        () =>
          executeTransaction({
            transactionId:
              id,
          }),

        'La transaction a été marquée comme exécutée.'
      );
    };

  const cancel =
    () => {
      if (
        !canCancelTransaction()
      ) {
        return;
      }

      Alert.alert(
        'Annuler',
        'Annuler cette transaction ?',
        [
          {
            text:
              'Non',
            style:
              'cancel',
          },

          {
            text:
              'Oui, annuler',

            style:
              'destructive',

            onPress:
              () =>
                run(
                  () =>
                    cancelTransaction({
                      transactionId:
                        id,

                      reason:
                        'Annulation depuis l’espace partenaire.',
                    }),

                  'La transaction a été annulée.'
                ),
          },
        ]
      );
    };

  return (
    <ScrollView
      style={{
        flex: 1,

        backgroundColor:
          colors.background
            .default,
      }}
      contentContainerStyle={{
        padding:
          spacing.screenHorizontal,

        paddingBottom:
          100,
      }}
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={
          typography.h1
        }
      >
        Détail de la transaction
      </Text>

      <Text
        style={[
          typography.caption,
          {
            marginTop:
              4,
          },
        ]}
      >
        {formatDateTime(
          t.created_at
        )}
      </Text>

      <Card
        style={{
          marginTop:
            20,
        }}
      >
        <View
          style={{
            flexDirection:
              'row',

            justifyContent:
              'space-between',

            alignItems:
              'center',
          }}
        >
          <Text
            style={
              typography.h2
            }
          >
            {formatAmount(
              t.amount
            )}
          </Text>

          <StatusBadge
            status={
              t.status
            }
          />
        </View>

        <Row
          label="Type"
          value={
            t.type
          }
        />

        <Row
          label="Workflow"
          value={
            t.workflow_stage
          }
        />

        <Row
          label="Expéditeur"
          value={
            t.sender_name ||
            '—'
          }
        />

        <Row
          label="Téléphone payeur"
          value={
            t.sender_phone_number
          }
        />

        <Row
          label="Indicatif payeur"
          value={
            t.sender_country_code ||
            '—'
          }
        />

        <Row
          label="Destinataire"
          value={
            t.recipient_name
          }
        />

        <Row
          label="Téléphone destinataire"
          value={
            t.recipient_mobile_number
          }
        />

        <Row
          label="Indicatif destinataire"
          value={
            t.recipient_country_code ||
            '—'
          }
        />

        <Row
          label="Localisation"
          value={
            t.recipient_location
          }
        />

        {t.reference_note ? (
          <Row
            label="Référence"
            value={
              t.reference_note
            }
          />
        ) : null}
      </Card>

      <InfoBanner
        text={
          isPartnerOperator() &&
          !isPartnerAdmin()
            ? 'Vous pouvez confirmer une transaction. Le rejet, l’approbation, l’exécution et l’annulation ne sont pas disponibles avec le rôle Partner.'
            : 'Les actions disponibles ci-dessous sont déterminées par votre rôle.'
        }
      />

      <View
        style={{
          marginTop:
            20,

          gap:
            10,
        }}
      >
        {canConfirmTransaction() &&
        pending ? (
          <Button
            title="Confirmer"
            variant="success"
            disabled={
              actionLoading
            }
            onPress={
              confirm
            }
          />
        ) : null}

        {canApproveTransaction() &&
        pending ? (
          <Button
            title="Approuver"
            disabled={
              actionLoading
            }
            onPress={
              approve
            }
          />
        ) : null}

        {canRejectTransaction() &&
        pending ? (
          <Button
            title="Rejeter"
            variant="danger"
            disabled={
              actionLoading
            }
            onPress={
              reject
            }
          />
        ) : null}

        {canExecuteTransaction() &&
        t.workflow_stage ===
          'execution' ? (
          <Button
            title="Marquer exécutée"
            disabled={
              actionLoading
            }
            onPress={
              execute
            }
          />
        ) : null}

        <Button
          title="Voir la vérification"
          variant="outline"
          disabled={
            actionLoading
          }
          onPress={() =>
            navigation.navigate(
              'PartnerTransactionReview',
              {
                transactionId:
                  id,

                transaction:
                  data,
              }
            )
          }
        />

        {canCancelTransaction() &&
        ![
          'completed',
          'rejected',
          'cancelled',
        ].includes(
          t.status
        ) ? (
          <Button
            title="Annuler"
            variant="ghost"
            disabled={
              actionLoading
            }
            onPress={
              cancel
            }
          />
        ) : null}
      </View>

      <Text
        style={[
          typography.h2,
          {
            marginTop:
              28,
          },
        ]}
      >
        Historique
      </Text>

      <Card
        style={{
          marginTop:
            10,
        }}
      >
        {(
          data.history ??
          []
        ).length ? (
          (
            data.history ??
            []
          ).map(
            (h) => (
              <View
                key={
                  h.id
                }
                style={{
                  paddingVertical:
                    10,

                  borderBottomWidth:
                    1,

                  borderBottomColor:
                    colors.border
                      .light,
                }}
              >
                <Text
                  style={
                    typography.bodyBold
                  }
                >
                  {
                    h.new_status
                  }
                </Text>

                <Text
                  style={
                    typography.caption
                  }
                >
                  {formatDateTime(
                    h.created_at
                  )}{' '}
                  ·{' '}
                  {h.reason ??
                    '—'}
                </Text>
              </View>
            )
          )
        ) : (
          <EmptyState
            title="Aucun événement"
            subtitle="L’historique apparaîtra ici."
          />
        )}
      </Card>
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
        paddingVertical:
          10,

        borderBottomWidth:
          1,

        borderBottomColor:
          colors.border
            .light,
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
          typography.bodyBold,
          {
            marginTop:
              3,
          },
        ]}
      >
        {value ??
          '—'}
      </Text>
    </View>
  );
}