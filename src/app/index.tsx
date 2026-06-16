import React, { useState, useEffect, useRef } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Animated, Dimensions } from 'react-native';

// Safe AdMob Import
let AdMob = null;
try {
  AdMob = require('react-native-google-mobile-ads');
} catch (e) {
  console.log("AdMob not available in this environment");
}

const { width, height } = Dimensions.get('window');

// Initialize Ads SDK safely only if available
if (AdMob && AdMob.MobileAds) {
  try {
    AdMob.MobileAds().initialize();
  } catch (e) {
    console.log("AdMob init error:", e);
  }
}

const adUnitId = __DEV__ ? (AdMob?.TestIds?.BANNER || '') : 'ca-app-pub-3940256099942544/6300978111';

const MatrixSplash = ({ onFinish }) => {
  const targetText = "CALCULADORA VINTAGE 25";
  const [displayText, setDisplayText] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*";
  
  useEffect(() => {
    const matrixInterval = 60; 
    let mIteration = 0;
    const timer = setInterval(() => {
        let current = targetText.split("").map((char, index) => {
            if (char === " ") return " ";
            if (mIteration > index * 3 + 10) return char;
            return chars[Math.floor(Math.random() * chars.length)];
        }).join("");
        
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
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <View style={styles.matrixBg}>
          {[...Array(10)].map((_, i) => (
              <Text key={i} style={[styles.matrixColumn, { left: (width/10) * i, fontSize: 10 + Math.random() * 10, opacity: 0.1 + Math.random() * 0.2 }]}>
                  {chars[Math.floor(Math.random() * chars.length)]}
              </Text>
          ))}
      </View>
      <Text style={styles.splashText}>{displayText}</Text>
    </Animated.View>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOn, setIsOn] = useState(false); 
  const [display, setDisplay] = useState('0.');
  const [equation, setEquation] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [shift, setShift] = useState(null); 
  const [memory, setMemory] = useState(0);
  
  const switchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(switchAnim, {
      toValue: isOn ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOn]);

  const handleNumber = (digit) => {
    if (!isOn) return;
    setShift(null);
    if (display === '0.' || isReset) {
      setDisplay(digit === '.' ? '0.' : digit + '.');
      setIsReset(false);
    } else {
      let current = display.replace('.', '');
      if (digit === '.' && display.includes('.')) return;
      if (digit === '.') {
        setDisplay(current + '.');
      } else {
        setDisplay(current + digit + '.');
      }
    }
  };

  const handleOperator = (op) => {
    if (!isOn) return;
    setShift(null);
    const currentVal = display.endsWith('.') ? display.slice(0, -1) : display;
    setEquation(equation + currentVal + ' ' + op + ' ');
    setIsReset(true);
  };

  const calculateResult = (expr) => {
    let mathExpression = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/asin\(/g, 'Math.asin(')
      .replace(/acos\(/g, 'Math.acos(')
      .replace(/atan\(/g, 'Math.atan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/\^/g, '**');

    try {
      let result = Function('"use strict";return (' + mathExpression + ')')();
      return result;
    } catch (e) {
      return 'Error';
    }
  };

  const handleEqual = () => {
    if (!isOn) return;
    setShift(null);
    if (!equation && !display.includes('(')) return;
    
    const currentVal = display.endsWith('.') ? display.slice(0, -1) : display;
    const fullExpression = equation + currentVal;
    
    const result = calculateResult(fullExpression);
    
    if (result === 'Error') {
      setDisplay('Error.');
    } else {
      let strResult = result.toString();
      if (!strResult.includes('.')) strResult += '.';
      setDisplay(strResult.substring(0, 12));
    }
    setEquation('');
    setIsReset(true);
  };

  const handleScientific = (func) => {
    if (!isOn) return;
    let val = parseFloat(display);
    let result;

    switch (func) {
      case 'sqrt': result = Math.sqrt(val); break;
      case 'sqr': result = val * val; break;
      case 'inv': result = 1 / val; break;
      case 'sin': result = Math.sin(val * Math.PI / 180); break;
      case 'cos': result = Math.cos(val * Math.PI / 180); break;
      case 'tan': result = Math.tan(val * Math.PI / 180); break;
      case 'asin': result = Math.asin(val) * 180 / Math.PI; break;
      case 'acos': result = Math.acos(val) * 180 / Math.PI; break;
      case 'atan': result = Math.atan(val) * 180 / Math.PI; break;
      case 'log': result = Math.log10(val); break;
      case 'ln': result = Math.log(val); break;
      case 'exp': result = Math.exp(val); break;
      case 'pow10': result = Math.pow(10, val); break;
      case 'pi': result = Math.PI; break;
      case 'abs': result = Math.abs(val); break;
      case 'chs': result = -val; break;
      default: return;
    }

    let strResult = result.toString();
    if (!strResult.includes('.')) strResult += '.';
    setDisplay(strResult.substring(0, 12));
    setIsReset(true);
    setShift(null);
  };

  const handleClear = () => {
    if (!isOn) return;
    setDisplay('0.');
    setEquation('');
    setIsReset(false);
    setShift(null);
  };

  const handleCLX = () => {
    if (!isOn) return;
    setDisplay('0.');
    setShift(null);
  };

  const handleStore = () => {
    if (!isOn) return;
    setMemory(parseFloat(display));
    setIsReset(true);
    setShift(null);
  };

  const handleRecall = () => {
    if (!isOn) return;
    let strRes = memory.toString();
    if (!strRes.includes('.')) strRes += '.';
    setDisplay(strRes);
    setIsReset(true);
    setShift(null);
  };

  const HPButton = ({ label, subLabel, onPress, type, active }) => {
    let btnStyle = styles.btnNumeric;
    let txtStyle = styles.txtWhite;

    if (type === 'f') btnStyle = styles.btnF;
    if (type === 'g') btnStyle = styles.btnG;
    if (type === 'op') btnStyle = styles.btnOperator;
    if (type === 'equal') btnStyle = styles.btnEqual;
    if (type === 'sci') btnStyle = styles.btnSci;

    return (
      <TouchableOpacity 
        style={[styles.buttonBase, btnStyle, active && styles.btnActive, !isOn && { opacity: 0.1 }]} 
        onPress={onPress} 
        activeOpacity={0.6}
        disabled={!isOn}
      >
        {subLabel && <Text style={styles.subLabelText}>{subLabel}</Text>}
        <Text style={[styles.btnText, txtStyle]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const onButtonPress = (mainFunc, fFunc, gFunc) => {
    if (!isOn) return;
    if (shift === 'f' && fFunc) fFunc();
    else if (shift === 'g' && gFunc) gFunc();
    else mainFunc();
  };

  const knobPosition = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18], 
  });

  if (showSplash) {
      return <MatrixSplash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.absoluteTitle}>
          <Text style={styles.brandText}>CALCULADORA VINTAGE 25</Text>
      </View>

      <View style={styles.calculatorBody}>
        <View style={[styles.displayContainer, !isOn && styles.displayOff]}>
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorText}>{isOn && (shift === 'f' ? 'f' : shift === 'g' ? 'g' : '')}</Text>
          </View>
          {isOn ? (
            <View style={styles.digitsWrapper}>
                <Text style={[styles.displayText, styles.displayTextBg]}>
                  {"888888888888"}
                </Text>
                <Text style={styles.displayText}>{display}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>OFF</Text>
            <TouchableOpacity 
                style={styles.switchBase} 
                onPress={() => {
                    setIsOn(!isOn);
                    if (!isOn) { 
                        setDisplay('0.');
                        setEquation('');
                    }
                }}
                activeOpacity={1}
            >
                <Animated.View style={[styles.switchKnob, { left: knobPosition }]} />
            </TouchableOpacity>
            <Text style={styles.switchLabel}>ON</Text>
          </View>
        </View>

        <View style={styles.keyboard}>
          {/* Row 1 */}
          <View style={styles.row}>
            <HPButton label="f" type="f" onPress={() => setShift(shift === 'f' ? null : 'f')} active={shift === 'f'} />
            <HPButton label="g" type="g" onPress={() => setShift(shift === 'g' ? null : 'g')} active={shift === 'g'} />
            <HPButton label="STO" type="sci" onPress={handleStore} />
            <HPButton label="RCL" type="sci" onPress={handleRecall} />
            <HPButton label="CLX" type="op" onPress={handleCLX} />
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <HPButton label="sin" subLabel="asin" type="sci" onPress={() => onButtonPress(() => handleScientific('sin'), () => handleScientific('asin'), null)} />
            <HPButton label="cos" subLabel="acos" type="sci" onPress={() => onButtonPress(() => handleScientific('cos'), () => handleScientific('acos'), null)} />
            <HPButton label="tan" subLabel="atan" type="sci" onPress={() => onButtonPress(() => handleScientific('tan'), () => handleScientific('atan'), null)} />
            <HPButton label="√x" subLabel="x²" type="sci" onPress={() => onButtonPress(() => handleScientific('sqrt'), () => handleScientific('sqr'), null)} />
            <HPButton label="y^x" type="op" onPress={() => handleOperator('^')} />
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <HPButton label="log" subLabel="10^x" type="sci" onPress={() => onButtonPress(() => handleScientific('log'), () => handleScientific('pow10'), null)} />
            <HPButton label="ln" subLabel="e^x" type="sci" onPress={() => onButtonPress(() => handleScientific('ln'), () => handleScientific('exp'), null)} />
            <HPButton label="1/x" subLabel="π" type="sci" onPress={() => onButtonPress(() => handleScientific('inv'), () => handleScientific('pi'), null)} />
            <HPButton label="CHS" subLabel="ABS" type="sci" onPress={() => onButtonPress(() => handleScientific('chs'), () => handleScientific('abs'), null)} />
            <HPButton label="EEX" type="sci" onPress={() => {}} />
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            <HPButton label="7" onPress={() => handleNumber('7')} />
            <HPButton label="8" onPress={() => handleNumber('8')} />
            <HPButton label="9" onPress={() => handleNumber('9')} />
            <HPButton label="÷" type="op" onPress={() => handleOperator('÷')} />
            <HPButton label="C" type="op" onPress={handleClear} />
          </View>

          {/* Row 5 */}
          <View style={styles.row}>
            <HPButton label="4" onPress={() => handleNumber('4')} />
            <HPButton label="5" onPress={() => handleNumber('5')} />
            <HPButton label="6" onPress={() => handleNumber('6')} />
            <HPButton label="×" type="op" onPress={() => handleOperator('×')} />
            <HPButton label="(" type="op" onPress={() => setDisplay(display === '0.' ? '(' : display + '(')} />
          </View>

          {/* Row 6 */}
          <View style={styles.row}>
            <HPButton label="1" onPress={() => handleNumber('1')} />
            <HPButton label="2" onPress={() => handleNumber('2')} />
            <HPButton label="3" onPress={() => handleNumber('3')} />
            <HPButton label="-" type="op" onPress={() => handleOperator('-')} />
            <HPButton label=")" type="op" onPress={() => setDisplay(display + ')')} />
          </View>

          {/* Row 7 */}
          <View style={styles.row}>
            <HPButton label="0" onPress={() => handleNumber('0')} />
            <HPButton label="." onPress={() => handleNumber('.')} />
            <HPButton label="Σ+" type="sci" onPress={() => {}} />
            <HPButton label="+" type="op" onPress={() => handleOperator('+')} />
            <HPButton label="=" type="equal" onPress={handleEqual} />
          </View>
        </View>

        <View style={styles.adContainer}>
          {AdMob && AdMob.BannerAd ? (
            <AdMob.BannerAd
                unitId={adUnitId}
                size={AdMob.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                requestNonPersonalizedAdsOnly: true,
                }}
            />
          ) : (
            <View style={styles.adPlaceholder}>
                <Text style={styles.adPlaceholderText}>ANUNCIO DISPONIBLE EN PRODUCCIÓN</Text>
            </View>
          )}
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
  matrixBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
  },
  matrixColumn: {
      position: 'absolute',
      color: '#0f0',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    position: 'absolute',
    top: Platform.OS === 'android' ? 5 : 40,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  brandText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
  },
  displayContainer: {
    backgroundColor: '#1a0000',
    height: '16%',
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#330000',
    marginTop: 25,
    marginBottom: 5,
    elevation: 10,
    overflow: 'hidden',
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
    fontSize: 16,
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
    fontSize: 48, 
    fontFamily: 'DSEG7',
    fontWeight: 'bold',
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
    fontFamily: 'DSEG7',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 5,
    paddingRight: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: 'bold',
    marginHorizontal: 5,
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
  switchKnob: {
    width: 18,
    height: 14,
    backgroundColor: '#666',
    borderRadius: 9,
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#888',
  },
  keyboard: {
    flex: 1,
    gap: 6,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
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
  adContainer: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  adPlaceholder: {
      padding: 10,
      backgroundColor: '#111',
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#222',
  },
  adPlaceholderText: {
      color: '#444',
      fontSize: 10,
      fontWeight: 'bold',
  }
});
