import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export interface CalcButtonProps {
  label: string;
  subLabel?: string;
  onPress: () => void;
  type?: 'f' | 'g' | 'op' | 'equal' | 'sci';
  active?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CalcButton = memo(function CalcButton({
  label,
  subLabel,
  onPress,
  type,
  active,
  disabled,
  style,
  textStyle,
}: CalcButtonProps) {
  let btnStyle = styles.btnNumeric;
  let txtStyle = styles.txtWhite;

  if (type === 'f') btnStyle = styles.btnF;
  if (type === 'g') btnStyle = styles.btnG;
  if (type === 'op') btnStyle = styles.btnOperator;
  if (type === 'equal') btnStyle = styles.btnEqual;
  if (type === 'sci') btnStyle = styles.btnSci;

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        btnStyle,
        active && styles.btnActive,
        disabled && { opacity: 0.1 },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={subLabel ? `${label}, ${subLabel}` : label}
      accessibilityHint={subLabel}
    >
      {subLabel && <Text style={styles.subLabelText}>{subLabel}</Text>}
      <Text style={[styles.btnText, txtStyle, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  buttonBase: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 8,
    elevation: 4,
  },
  btnNumeric: { backgroundColor: '#333' },
  btnOperator: { backgroundColor: '#222' },
  btnSci: { backgroundColor: '#2a2a2a' },
  btnF: { backgroundColor: '#FFB300' },
  btnG: { backgroundColor: '#0091EA' },
  btnEqual: { backgroundColor: '#444', borderWidth: 1, borderColor: '#777' },
  btnActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subLabelText: {
    position: 'absolute',
    top: 2,
    fontSize: 9,
    color: '#FFB300',
    fontWeight: 'bold',
  },
  txtWhite: { color: '#fff' },
});
