// Secure-ish persistent storage for auth tokens and per-order QR tokens.
// We use expo-secure-store on native, fall back to AsyncStorage on web.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const useSecure = Platform.OS !== 'web';

export async function setItem(key, value) {
  if (useSecure) return SecureStore.setItemAsync(key, value);
  return AsyncStorage.setItem(key, value);
}

export async function getItem(key) {
  if (useSecure) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(key);
}

export async function deleteItem(key) {
  if (useSecure) return SecureStore.deleteItemAsync(key);
  return AsyncStorage.removeItem(key);
}
