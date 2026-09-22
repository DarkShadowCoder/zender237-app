/**
 * Géolocalisation utilisée au démarrage d'un transfert.
 *
 * Le pays d'origine est déterminé à partir de la position actuelle
 * du téléphone, puis enregistré dans `profiles.country` via une RPC
 * SECURITY DEFINER. L'application limite cette fonctionnalité aux
 * trois pays pris en charge par Zender237 : Cameroun, Guinée et Mali.
 */

import * as Location from 'expo-location';

import { supabase } from '../lib/supabase';


const COUNTRY_BY_ISO = {
  CM: 'cameroun',
  GN: 'guinee',
  ML: 'mali',
};


const COUNTRY_ALIASES = {
  cameroun: 'cameroun',
  cameroon: 'cameroun',
  guinee: 'guinee',
  guinea: 'guinee',
  'guinée': 'guinee',
  mali: 'mali',
};


function normalizeCountryText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}


function buildLocationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}


/**
 * Détermine le pays à partir de la position actuelle.
 */
export async function detectCurrentCountry() {
  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw buildLocationError(
      'LOCATION_PERMISSION_REQUIRED',
      'La localisation est nécessaire pour déterminer votre pays de transfert. Autorisez l’accès à votre position puis réessayez.'
    );
  }

  let location = null;

  try {
    location = await Location.getLastKnownPositionAsync({
      maxAge: 5 * 60 * 1000,
      requiredAccuracy: 50000,
    });
  } catch (_) {
    location = null;
  }

  if (!location) {
    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (error) {
      throw buildLocationError(
        'LOCATION_UNAVAILABLE',
        error?.message ||
          'Impossible d’obtenir votre position actuelle.'
      );
    }
  }

  const latitude = location?.coords?.latitude;
  const longitude = location?.coords?.longitude;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw buildLocationError(
      'LOCATION_UNAVAILABLE',
      'La position actuelle du téléphone est invalide.'
    );
  }

  let addresses = [];

  try {
    addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
  } catch (error) {
    throw buildLocationError(
      'GEOCODING_FAILED',
      error?.message ||
        'Impossible de déterminer le pays à partir de votre position.'
    );
  }

  const address = addresses?.[0] || null;
  const isoCode = String(
    address?.countryCode || ''
  )
    .trim()
    .toUpperCase();

  let country =
    COUNTRY_BY_ISO[isoCode] || null;

  if (!country) {
    const normalizedCountry =
      normalizeCountryText(
        address?.country
      );

    country =
      COUNTRY_ALIASES[normalizedCountry] ||
      null;
  }

  if (!country) {
    throw buildLocationError(
      'LOCATION_COUNTRY_UNSUPPORTED',
      'Votre position actuelle se trouve en dehors des pays pris en charge (Cameroun, Guinée ou Mali).'
    );
  }

  return {
    country,
    countryCode: isoCode || null,
    latitude,
    longitude,
    city:
      address?.city ||
      address?.district ||
      address?.subregion ||
      null,
    region:
      address?.region ||
      null,
    accuracy:
      Number.isFinite(
        location?.coords?.accuracy
      )
        ? location.coords.accuracy
        : null,
  };
}


/**
 * Détecte puis enregistre le pays courant dans le profil utilisateur.
 */
export async function detectAndPersistCurrentCountry({
  userId,
}) {
  if (!userId) {
    throw new Error(
      'Utilisateur non authentifié.'
    );
  }

  const detected =
    await detectCurrentCountry();

  const {
    data,
    error,
  } = await supabase.rpc(
    'set_my_detected_country',
    {
      p_country:
        detected.country,
    }
  );

  if (error) {
    const rpcError = new Error(
      error.message ||
        'Impossible d’enregistrer votre pays de localisation.'
    );

    rpcError.code =
      error.code ||
      'COUNTRY_PERSIST_FAILED';

    throw rpcError;
  }

  return {
    ...detected,
    profile: data || null,
  };
}
