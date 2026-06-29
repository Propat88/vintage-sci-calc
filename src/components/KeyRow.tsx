import React, { memo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { CalcButton, type CalcButtonProps } from '@/components/CalcButton';

interface KeyRowProps {
  style?: ViewStyle;
  buttons: CalcButtonProps[];
}

export const KeyRow = memo(function KeyRow({ style, buttons }: KeyRowProps) {
  return (
    <View style={[styles.row, style]}>
      {buttons.map((btn, idx) => (
        <CalcButton key={`${btn.label}-${idx}`} {...btn} />
      ))}
    </View>
  );
});

const styles = {
  row: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 6,
  },
};
