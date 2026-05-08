// Real, scannable QR rendered inside a white card matching the design.
// We let react-native-qrcode-svg do the heavy lifting; the central logo
// chip is the same styling cue from the mockup.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius } from '../theme/colors';

export default function QRDisplay({ value, size = 220 }) {
  return (
    <View style={[styles.box, { padding: 18 }]}>
      <QRCode
        value={value}
        size={size}
        color={colors.bg}
        backgroundColor="white"
        logo={undefined}
      />
      <View style={[styles.center, { width: 36, height: 36, borderRadius: 8, top: 18 + size / 2 - 18, left: 18 + size / 2 - 18 }]}>
        <Text style={styles.centerText}>☕</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'white',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  center: {
    position: 'absolute',
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { fontSize: 18 },
});
