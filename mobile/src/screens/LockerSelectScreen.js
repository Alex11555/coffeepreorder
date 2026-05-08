// Locker selection now lives inline on OrderScreen (matches the new design).
// Kept as a graceful fallback that pushes the user back to the menu.
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function LockerSelectScreen() {
  const nav = useNavigation();
  useEffect(() => {
    nav.replace?.('Main', { screen: 'Menu' }) ?? nav.navigate('Main', { screen: 'Menu' });
  }, [nav]);
  return null;
}
