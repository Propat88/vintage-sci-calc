import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';

interface SciDisplayProps {
  mantissa: string;
  sign: string;
  exponent: string;
  style?: any;
}

export const SciDisplay = memo(function SciDisplay({
  mantissa,
  sign,
  exponent,
  style,
}: SciDisplayProps) {
  return (
    <Text style={style}>
      <Text>{mantissa}</Text>
      <Text style={styles.sign}>{sign}</Text>
      <Text>{exponent.padStart(2, '0')}</Text>
      <Text style={styles.dot}>.</Text>
    </Text>
  );
});

const styles = StyleSheet.create({
  sign: {
    opacity: 0.6,
    width: 16,
    textAlign: 'center',
  },
  dot: {
    opacity: 0.4,
  },
});
