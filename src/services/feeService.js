// src/services/feeService.js

import { supabase } from '../lib/supabase';
import { normalizeTariffRoute } from './tariffService';

/**
 * Retourne les frais d'un transfert dans les deux sens d'un même Frais.
 *
 * Exemple :
 *
 * Guinée -> Cameroun
 * Cameroun -> Guinée
 *
 * utilisent exactement le même tarif.
 */
export async function getTransferFee({
  fromCountry,
  toCountry,
  amount,
}) {
  if (
    !fromCountry ||
    !toCountry ||
    !amount ||
    Number(amount) <= 0
  ) {
    return null;
  }

  let route;

  try {
    route =
      normalizeTariffRoute(
        fromCountry,
        toCountry
      );
  } catch (_) {
    return null;
  }

  const numericAmount =
    Number(
      amount
    );

  /**
   * 1. On recherche d'abord le Frais canonique.
   */
  const {
    data:
      canonicalFee,
    error:
      canonicalError,
  } =
    await supabase.rpc(
      'get_transfer_fee',
      {
        p_country_a:
          route.country_a,

        p_country_b:
          route.country_b,

        p_amount:
          numericAmount,
      }
    );

  if (canonicalError) {
    throw new Error(
      canonicalError.message
    );
  }

  if (
    canonicalFee !==
      null &&
    canonicalFee !==
      undefined
  ) {
    return canonicalFee;
  }

  /**
   * 2. Compatibilité avec d'anciennes données
   * potentiellement encore stockées dans l'orientation
   * inverse.
   */
  const {
    data:
      reverseFee,
    error:
      reverseError,
  } =
    await supabase.rpc(
      'get_transfer_fee',
      {
        p_country_a:
          route.country_b,

        p_country_b:
          route.country_a,

        p_amount:
          numericAmount,
      }
    );

  if (reverseError) {
    throw new Error(
      reverseError.message
    );
  }

  return (
    reverseFee ??
    null
  );
}

/**
 * Retourne les destinations disponibles à partir
 * d'un pays, quelle que soit l'orientation du tarif
 * en base.
 */
export async function getAvailableDestinationCountries(
  fromCountry
) {
  if (!fromCountry) {
    return [];
  }

  const normalizedFrom =
    String(
      fromCountry
    )
      .trim()
      .toLowerCase();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'transfer_fee_tariffs'
      )
      .select(
        'country_a, country_b'
      )
      .or(
        `country_a.eq.${normalizedFrom},country_b.eq.${normalizedFrom}`
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  const destinations =
    new Set();

  for (
    const row of
      data ?? []
  ) {
    const destination =
      row.country_a ===
        normalizedFrom
        ? row.country_b
        : row.country_a;

    if (destination) {
      destinations.add(
        destination
      );
    }
  }

  return [
    ...destinations,
  ];
}

export async function getMyCountry() {
  const {
    data:
      authData,
    error:
      authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !authData?.user
  ) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'profiles'
      )
      .select(
        'country'
      )
      .eq(
        'id',
        authData.user.id
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  return (
    data?.country ??
    null
  );
}