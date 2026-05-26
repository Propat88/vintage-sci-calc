// @ts-nocheck
import React, { useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';

export default function App() {
  const [display, setDisplay] = useState('0.');
  const [equation, setEquation] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [shift, setShift] = useState(null); // 'f' or 'g'
  const [memory, setMemory] = useState(0);

  const handleNumber = (digit) => {
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
    setShift(null);
    const currentVal = display.endsWith('.') ? display.slice(0, -1) : display;
    setEquation(equation + currentVal + ' ' + op + ' ');
    setIsReset(true);
  };

  const calculateResult = (expr) => {
    // Translate visual symbols to JS math
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
      // Basic degrees to radians conversion for trig if needed, 
      // but keeping it simple for now (radians)
      let result = Function('"use strict";return (' + mathExpression + ')')();
      return result;
    } catch (e) {
      return 'Error';
    }
  };

  const handleEqual = () => {
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
    setDisplay('0.');
    setEquation('');
    setIsReset(false);
    setShift(null);
  };

  const handleCLX = () => {
    setDisplay('0.');
    setShift(null);
  };

  const handleStore = () => {
    setMemory(parseFloat(display));
    setIsReset(true);
    setShift(null);
  };

  const handleRecall = () => {
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
        style={[styles.buttonBase, btnStyle, active && styles.btnActive]} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        {subLabel && <Text style={styles.subLabelText}>{subLabel}</Text>}
        <Text style={[styles.btnText, txtStyle]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const onButtonPress = (mainFunc, fFunc, gFunc, type) => {
    if (shift === 'f' && fFunc) {
      fFunc();
    } else if (shift === 'g' && gFunc) {
      gFunc();
    } else {
      mainFunc();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.calculatorBody}>
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>HEWLETT · PACKARD 25</Text>
        </View>

        <View style={styles.displayContainer}>
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorText}>{shift === 'f' ? 'f' : shift === 'g' ? 'g' : ''}</Text>
          </View>
          <Text style={styles.displayText}>{display}</Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  calculatorBody: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 10,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  brandText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  displayContainer: {
    backgroundColor: '#1a0000',
    height: '15%',
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#300',
    marginBottom: 10,
  },
  indicatorRow: {
    position: 'absolute',
    top: 5,
    left: 10,
  },
  indicatorText: {
    color: '#FFB300',
    fontSize: 16,
    fontWeight: 'bold',
  },
  displayText: {
    color: '#ff3333',
    fontSize: 40,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: 'bold',
  },
  keyboard: {
    flex: 1,
    gap: 8,
    marginBottom: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  buttonBase: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 10,
  },
  btnNumeric: { backgroundColor: '#333' },
  btnOperator: { backgroundColor: '#000' },
  btnSci: { backgroundColor: '#222' },
  btnF: { backgroundColor: '#FFB300' },
  btnG: { backgroundColor: '#0091EA' },
  btnEqual: { backgroundColor: '#444' },
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
    top: 4,
    fontSize: 10,
    color: '#FFB300',
    fontWeight: 'bold',
  },
  txtWhite: { color: '#fff' },
});
