"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, StatusBar, Animated, Dimensions, PixelRatio } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCalculatorEngine } from '@/hooks/useCalculatorEngine';
import { SciDisplay } from '@/components/SciDisplay';
import { KeyRow } from '@/components/KeyRow';
import { AdMobPlaceholder } from '@/components/AdMobPlaceholder';

const { width, height } = Dimensions.get('window');

const smallScreen = Math.min(width, height) < 360;
const fontScale = smallScreen ? 0.82 : 1;

const MatrixSplash = ({ onFinish }: { onFinish: () => void }) => {
  const targetText = 'VINTAGE SCI CALCULATOR';
  const [displayText, setDisplayText] = useState('');
  const fadeAnim = useMemo(() => new Animated.Value(1), []);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*';

  useEffect(() => {
    const matrixInterval = 60;
    let mIteration = 0;
    const timer = setInterval(() => {
      let current = targetText.split('').map((char, index) => {
        if (char === ' ') return ' ';
        if (mIteration > index * 3 + 10) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');

      setDisplayText(current);
      mIteration++;

      if (mIteration > targetText.length * 4) {
        clearInterval(timer);
        setDisplayText(targetText);
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }).start(() => onFinish());
        }, 1500);
      }
    }, matrixInterval);

    return () => clearInterval(timer);
  }, [onFinish, fadeAnim]);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <Text style={styles.splashText}>{displayText}</Text>
    </Animated.View>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const engine = useCalculatorEngine();
  const { isOn, shift, prgmMode, isRunningPrgm, vibrationEnabled } = engine;
  const insets = useSafeAreaInsets();

  if (showSplash) {
    return <MatrixSplash onFinish={() => setShowSplash(false)} />;
  }

  const knobPosition = engine.switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18],
  });

  const sciParts = engine.exponentMode ? engine.getSciParts() : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" translucent={false} />

      <View style={[styles.titleWrapper, { paddingTop: Math.max(insets.top, 6) }]}>
        <Text style={styles.brandText}>VINTAGE SCI CALCULATOR</Text>
      </View>

      <View style={styles.calculatorBody}>
        <View style={[styles.displayContainer, !isOn && styles.displayOff]}>
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorText}>
              {isOn && (isRunningPrgm ? 'EJEC' : prgmMode ? 'PROG' : shift === 'f' ? 'f' : shift === 'g' ? 'g' : '')}
            </Text>
          </View>
          {isOn ? (
            <View style={styles.digitsWrapper}>
              <Text style={[styles.displayText, styles.displayTextBg]}>
                {'888888888888'}
              </Text>
              {sciParts ? (
                <SciDisplay mantissa={sciParts.mantissa} sign={sciParts.sign} exponent={sciParts.exponent} style={styles.displayText} />
              ) : (
                <Text style={styles.displayText}>{engine.display}</Text>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.switchRow}>
          <View style={[styles.switchContainer, !isOn && { opacity: 0.15 }]}>
            <Text style={[styles.switchLabel, styles.switchLabelLeft]}>RUN</Text>
            <TouchableOpacity
              style={styles.switchBase}
              onPress={engine.togglePrgm}
              activeOpacity={1}
              disabled={!isOn}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Program mode"
              accessibilityState={{ checked: prgmMode }}
            >
              <Animated.View style={[styles.switchKnob, { left: engine.prgmAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] }) }]} />
            </TouchableOpacity>
            <Text style={[styles.switchLabel, styles.switchLabelRight]}>PRG</Text>
          </View>

          <View style={[styles.switchContainer, !isOn && { opacity: 0.15 }]}>
            <Text style={[styles.switchLabel, styles.switchLabelLeft]}>OFF</Text>
            <TouchableOpacity
              style={styles.switchBase}
              onPress={engine.toggleVibration}
              activeOpacity={1}
              disabled={!isOn}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Vibration feedback"
              accessibilityState={{ checked: vibrationEnabled }}
            >
              <Animated.View style={[styles.switchKnob, { left: engine.vibAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] }) }]} />
            </TouchableOpacity>
            <Text style={[styles.switchLabel, styles.switchLabelRight]}>VIB</Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, styles.switchLabelLeft]}>OFF</Text>
            <TouchableOpacity
              style={styles.switchBase}
              onPress={engine.togglePower}
              activeOpacity={1}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Power"
              accessibilityState={{ checked: isOn }}
            >
              <Animated.View style={[styles.switchKnob, { left: knobPosition }]} />
            </TouchableOpacity>
            <Text style={[styles.switchLabel, styles.switchLabelRight]}>ON</Text>
          </View>
        </View>

        <View style={styles.keyboard}>
          <KeyRow
            buttons={[
              { label: 'f', type: 'f', onPress: () => engine.toggleShift('f'), active: engine.shift === 'f', disabled: !isOn },
              { label: 'g', type: 'g', onPress: () => engine.toggleShift('g'), active: engine.shift === 'g', disabled: !isOn },
              { label: 'STO', subLabel: 'SST', type: 'sci', onPress: () => engine.handleAction({ type: 'store', label: 'STO' }), disabled: !isOn },
              { label: 'RCL', subLabel: 'BST', type: 'sci', onPress: () => engine.handleAction({ type: 'recall', label: 'RCL' }), disabled: !isOn },
              { label: 'CLX', subLabel: 'GTO', type: 'op', onPress: () => engine.handleAction({ type: 'clx', label: 'CLX' }), disabled: !isOn },
            ]}
          />

          <KeyRow
            buttons={[
              { label: 'sin', subLabel: 'asin', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'asin', label: 'asin' } : { type: 'sci', val: 'sin', label: 'sin' }), disabled: !isOn },
              { label: 'cos', subLabel: 'acos', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'acos', label: 'acos' } : { type: 'sci', val: 'cos', label: 'cos' }), disabled: !isOn },
              { label: 'tan', subLabel: 'atan', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'atan', label: 'atan' } : { type: 'sci', val: 'tan', label: 'tan' }), disabled: !isOn },
              { label: '√x', subLabel: 'x²', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'sqr', label: 'x²' } : { type: 'sci', val: 'sqrt', label: '√x' }), disabled: !isOn },
              { label: 'y^x', type: 'op', onPress: () => engine.handleAction({ type: 'operator', val: '^', label: 'y^x' }), disabled: !isOn },
            ]}
          />

          <KeyRow
            buttons={[
              { label: 'log', subLabel: '10^x', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'pow10', label: '10^x' } : { type: 'sci', val: 'log', label: 'log' }), disabled: !isOn },
              { label: 'ln', subLabel: 'e^x', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'exp', label: 'e^x' } : { type: 'sci', val: 'ln', label: 'ln' }), disabled: !isOn },
              { label: '1/x', subLabel: 'π', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'pi', label: 'π' } : { type: 'sci', val: 'inv', label: '1/x' }), disabled: !isOn },
              { label: 'CHS', subLabel: 'ABS', type: 'sci', onPress: () => engine.handleAction(engine.shift === 'f' ? { type: 'sci', val: 'abs', label: 'ABS' } : { type: 'sci', val: 'chs', label: 'CHS' }), disabled: !isOn },
              { label: 'EEX', type: 'sci', onPress: () => engine.handleAction({ type: 'eex', label: 'EEX' }), disabled: !isOn },
            ]}
          />

          <KeyRow
            buttons={[
              { label: '7', onPress: () => engine.handleAction({ type: 'number', val: '7', label: '7' }), disabled: !isOn },
              { label: '8', onPress: () => engine.handleAction({ type: 'number', val: '8', label: '8' }), disabled: !isOn },
              { label: '9', onPress: () => engine.handleAction({ type: 'number', val: '9', label: '9' }), disabled: !isOn },
              { label: '÷', type: 'op', onPress: () => engine.handleAction({ type: 'operator', val: '÷', label: '÷' }), disabled: !isOn },
              { label: 'C', subLabel: 'CL PRG', type: 'op', onPress: () => engine.handleAction({ type: 'clear', label: 'C' }), disabled: !isOn },
            ]}
          />

          <KeyRow
            buttons={[
              { label: '4', onPress: () => engine.handleAction({ type: 'number', val: '4', label: '4' }), disabled: !isOn },
              { label: '5', onPress: () => engine.handleAction({ type: 'number', val: '5', label: '5' }), disabled: !isOn },
              { label: '6', onPress: () => engine.handleAction({ type: 'number', val: '6', label: '6' }), disabled: !isOn },
              { label: '×', type: 'op', onPress: () => engine.handleAction({ type: 'operator', val: '×', label: '×' }), disabled: !isOn },
              { label: '(', type: 'op', onPress: () => engine.handleAction({ type: 'open_paren', label: '(' }), disabled: !isOn },
            ]}
          />

          <KeyRow
            buttons={[
              { label: '1', onPress: () => engine.handleAction({ type: 'number', val: '1', label: '1' }), disabled: !isOn },
              { label: '2', onPress: () => engine.handleAction({ type: 'number', val: '2', label: '2' }), disabled: !isOn },
              { label: '3', onPress: () => engine.handleAction({ type: 'number', val: '3', label: '3' }), disabled: !isOn },
              { label: '-', type: 'op', onPress: () => engine.handleAction({ type: 'operator', val: '-', label: '-' }), disabled: !isOn },
              { label: ')', type: 'op', onPress: () => engine.handleAction({ type: 'close_paren', label: ')' }), disabled: !isOn },
            ]}
          />

          <KeyRow
            buttons={[
              { label: '0', onPress: () => engine.handleAction({ type: 'number', val: '0', label: '0' }), disabled: !isOn },
              { label: '.', onPress: () => engine.handleAction({ type: 'number', val: '.', label: '.' }), disabled: !isOn },
              { label: 'R/S', subLabel: 'Σ+', type: 'sci', onPress: () => engine.handleAction({ type: 'runstop', label: 'R/S' }), disabled: !isOn },
              { label: '+', type: 'op', onPress: () => engine.handleAction({ type: 'operator', val: '+', label: '+' }), disabled: !isOn },
              { label: '=', type: 'equal', onPress: () => engine.handleAction({ type: 'equal', label: '=' }), disabled: !isOn },
            ]}
          />
      </View>

      <View style={styles.adContainer}>
        <AdMobPlaceholder />
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  splashText: {
    color: '#ff3333',
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(255, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  calculatorBody: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    paddingTop: 10,
  },
  absoluteTitle: {
    alignItems: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    width: '100%',
    paddingVertical: 8,
  },
  brandText: {
    color: '#fff',
    fontSize: PixelRatio.roundToNearestPixel(14 * fontScale),
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  displayContainer: {
    backgroundColor: '#1a0000',
    height: PixelRatio.roundToNearestPixel((smallScreen ? 90 : 120) * fontScale),
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#330000',
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  displayOff: {
    backgroundColor: '#050000',
    borderColor: '#110000',
  },
  indicatorRow: {
    position: 'absolute',
    top: 8,
    left: 12,
  },
  indicatorText: {
    color: '#FFB300',
    fontSize: PixelRatio.roundToNearestPixel(14 * fontScale),
    fontWeight: 'bold',
  },
  digitsWrapper: {
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
  displayText: {
    color: '#ff3333',
    fontSize: PixelRatio.roundToNearestPixel(56 * fontScale),
    fontFamily: 'SevenSegment',
    letterSpacing: 2,
    textAlign: 'right',
    textShadowColor: 'rgba(255, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  displayTextBg: {
    position: 'absolute',
    color: '#220000',
    opacity: 0.2,
    textShadowRadius: 0,
    fontSize: PixelRatio.roundToNearestPixel(56 * fontScale),
    fontFamily: 'SevenSegment',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 5,
    paddingHorizontal: 0,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    paddingVertical: 5,
    borderRadius: 20,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchLabel: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  switchLabelLeft: {
    width: 26,
    textAlign: 'right',
    marginRight: 3,
  },
  switchLabelRight: {
    width: 26,
    textAlign: 'left',
    marginLeft: 3,
  },
  switchKnob: {
    width: 18,
    height: 14,
    backgroundColor: '#666',
    borderRadius: 9,
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#888',
  },
  switchBase: {
    width: 44,
    height: 22,
    backgroundColor: '#000',
    borderRadius: 11,
    padding: 2,
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
    justifyContent: 'center',
  },
  keyboard: {
    flex: 1,
    gap: 6,
  },
  adContainer: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
});
