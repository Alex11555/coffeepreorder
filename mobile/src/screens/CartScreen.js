// The new flow doesn't have a multi-item cart — checkout happens directly
// from the item detail screen. This screen is kept as a graceful fallback
// in case anything still navigates here: it just bounces back to the menu.
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
  const nav = useNavigation();
  useEffect(() => {
    nav.replace?.('Main', { screen: 'Menu' }) ?? nav.navigate('Main', { screen: 'Menu' });
  }, [nav]);
  return null;
}
