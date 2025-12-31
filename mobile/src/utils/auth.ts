import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

export async function saveAuth(token: string, user: User): Promise<void> {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function getAuth(): Promise<{ token: string | null; user: User | null }> {
  const token = await AsyncStorage.getItem('token');
  const userStr = await AsyncStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}
