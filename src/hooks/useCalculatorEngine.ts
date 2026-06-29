import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { safeEval } from '@/utils/evaluator';

const MEMORY_KEY = 'calc.memory';
const PROGRAM_KEY = 'calc.program';

export type Action = {
  type: string;
  val?: string;
  label: string;
};

export interface CalculatorState {
  display: string;
  equation: string;
  shift: 'f' | 'g' | null;
  isOn: boolean;
  prgmMode: boolean;
  isRunningPrgm: boolean;
  vibrationEnabled: boolean;
  exponentMode: boolean;
  exponentDigits: string;
  exponentSign: number;
  program: string[];
  prgmPointer: number;
  switchAnim: Animated.Value;
  prgmAnim: Animated.Value;
  vibAnim: Animated.Value;
  getSciParts: () => { mantissa: string; sign: string; exponent: string } | null;
}

export interface CalculatorActions {
  handleAction: (action: Action) => void;
  togglePower: () => void;
  toggleVibration: () => void;
  togglePrgm: () => void;
  toggleShift: (mode: 'f' | 'g') => void;
  getSciParts: () => { mantissa: string; sign: string; exponent: string } | null;
}

export function useCalculatorEngine(): CalculatorState & CalculatorActions {
  const [prgmMode, setPrgmMode] = useState(false);
  const [program, setProgram] = useState<string[]>([]);
  const [prgmPointer, setPrgmPointer] = useState(0);
  const [isRunningPrgm, setIsRunningPrgm] = useState(false);
  const isRunningRef = useRef(false);
  const [shift, setShift] = useState<'f' | 'g' | null>(null);

  const [isOn, setIsOn] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [display, setDisplay] = useState('0.');
  const [isReset, setIsReset] = useState(false);
  const [equation, setEquation] = useState('');
  const [memory, setMemory] = useState(0);
  const switchAnim = useMemo(() => new Animated.Value(0), []);
  const prgmAnim = useMemo(() => new Animated.Value(0), []);
  const vibAnim = useMemo(() => new Animated.Value(0), []);

  const [exponentMode, setExponentMode] = useState(false);
  const [exponentDigits, setExponentDigits] = useState('');
  const [exponentSign, setExponentSign] = useState(1);
  const mantissaRef = useRef('0');
  const dotPressedRef = useRef(false);
  const runIdRef = useRef(0);

  const parseDisplay = (d: string) => parseFloat(d.endsWith('.') ? d.slice(0, -1) : d);

  const formatResult = (result: number): string => {
    if (typeof result !== 'number' || !Number.isFinite(result)) return 'Error.';
    const cleaned = parseFloat(result.toPrecision(12));
    const str = cleaned.toString();
    if (str.length > 12) return 'Error.';
    if (!str.includes('.')) return str + '.';
    return str;
  };

  const composeSciValue = useCallback(() => {
    const mantissa = parseDisplay(mantissaRef.current);
    const exp = exponentDigits === '' ? 0 : parseInt(exponentDigits, 10) * exponentSign;
    return mantissa * Math.pow(10, exp);
  }, [exponentDigits, exponentSign]);

  const computedDisplay = useMemo(() => {
    if (!isOn || !prgmMode) return display;
    const stepNum = prgmPointer.toString().padStart(2, '0');
    if (prgmPointer < program.length) {
      const action = program[prgmPointer];
      return `${stepNum} - ${(action || '00').toUpperCase().substring(0, 5)}.`;
    }
    return `${stepNum} - 00.`;
  }, [prgmMode, prgmPointer, program, isOn, display]);

  useEffect(() => {
    Animated.timing(switchAnim, {
      toValue: isOn ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOn, switchAnim]);

  useEffect(() => {
    Animated.timing(vibAnim, {
      toValue: vibrationEnabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [vibrationEnabled, vibAnim]);

  useEffect(() => {
    if (!exponentMode) {
      mantissaRef.current = display;
    }
  }, [display, exponentMode]);

  useEffect(() => {
    Animated.timing(prgmAnim, {
      toValue: prgmMode ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [prgmMode, prgmAnim]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [mem, prog] = await Promise.all([
          SecureStore.getItemAsync(MEMORY_KEY),
          SecureStore.getItemAsync(PROGRAM_KEY),
        ]);
        if (cancelled) return;
        if (mem !== null) setMemory(parseFloat(mem));
        if (prog !== null) setProgram(JSON.parse(prog));
      } catch {
        // ignore storage errors
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    SecureStore.setItemAsync(MEMORY_KEY, memory.toString()).catch(() => {});
  }, [memory]);

  useEffect(() => {
    SecureStore.setItemAsync(PROGRAM_KEY, JSON.stringify(program)).catch(() => {});
  }, [program]);

  const triggerFeedback = useCallback(async () => {
    if (!isOn || !vibrationEnabled) return;
    try {
      if (Haptics && Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // ignore feedback errors
    }
  }, [isOn, vibrationEnabled]);

  const handleNumber = useCallback(
    (digit: string) => {
      if (!isOn) return;

      if (exponentMode) {
        if (digit === '.') return;
        if (digit === '0' && exponentDigits === '0') return;
        if (exponentDigits.length >= 2) return;

        const next = exponentDigits === '' ? digit : exponentDigits + digit;
        setExponentDigits(next);

        const mantissaDisplay = ['0', '0.'].includes(mantissaRef.current) ? '0.' : mantissaRef.current;
        const signStr = exponentSign === -1 ? '-' : ' ';
        setDisplay(`${mantissaDisplay}${signStr}${next.padStart(2, '0')}.`);
        return;
      }

      const endsWithFormatterDot = display.endsWith('.');
      const dotIndex = display.lastIndexOf('.');
      const hasRealDecimal = dotIndex !== -1 && dotIndex !== display.length - 1;

      if (digit === '.') {
        if (!hasRealDecimal && !dotPressedRef.current) {
          dotPressedRef.current = true;
          setDisplay(display.slice(0, -1) + '.');
        }
        setIsReset(false);
        return;
      }

      if (display === '0.' || isReset) {
        if (dotPressedRef.current) {
          const parts = display.split('.');
          if (parts.length >= 2) {
            parts[1] = parts[1] + digit;
            setDisplay(parts.join('.') + '.');
          } else {
            setDisplay(display.slice(0, -1) + '.' + digit + '.');
          }
        } else {
          setDisplay(digit + '.');
        }
        dotPressedRef.current = false;
        setIsReset(false);
        return;
      }

      if (dotPressedRef.current) {
        const parts = display.split('.');
        if (parts.length >= 2) {
          parts[1] = parts[1] + digit;
          setDisplay(parts.join('.') + '.');
        } else {
          setDisplay(display.slice(0, -1) + '.' + digit + '.');
        }
      } else if (endsWithFormatterDot) {
        setDisplay(display.slice(0, -1) + digit + '.');
      } else if (hasRealDecimal) {
        setDisplay(display + digit + '.');
      } else {
        setDisplay(display.slice(0, -1) + digit + '.');
      }
      dotPressedRef.current = false;
    },
    [display, isReset, isOn, exponentMode, exponentDigits, exponentSign]
  );

  const handleOperator = useCallback(
    (op: string) => {
      if (!isOn) return;

      let currentVal: string;
      if (exponentMode) {
        currentVal = composeSciValue().toString();
        setExponentMode(false);
        setExponentDigits('');
        setExponentSign(1);
      } else {
        currentVal = display.endsWith('.') ? display.slice(0, -1) : display;
      }

      setEquation(prev => prev + currentVal + ' ' + op + ' ');
      setIsReset(true);
      dotPressedRef.current = false;
    },
    [display, isOn, exponentMode, composeSciValue]
  );

  const calculateResult = useCallback((expr: string) => {
    try {
      const result = safeEval(expr);
      return result;
    } catch {
      return NaN;
    }
  }, []);

  const handleEqual = useCallback(() => {
    if (!equation && !display.includes('(')) return;

    let currentVal: string;
    if (exponentMode) {
      currentVal = composeSciValue().toString();
      setExponentMode(false);
      setExponentDigits('');
      setExponentSign(1);
    } else {
      currentVal = display.endsWith('.') ? display.slice(0, -1) : display;
    }

    const fullExpression = equation + currentVal;

    const opens = (fullExpression.match(/\(/g) || []).length;
    const closes = (fullExpression.match(/\)/g) || []).length;
    if (opens !== closes) {
      setDisplay('Error.');
      setEquation('');
      setIsReset(true);
      dotPressedRef.current = false;
      return;
    }

    const result = calculateResult(fullExpression);
    let formatted: string;
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      formatted = 'Error.';
    } else {
      formatted = formatResult(result);
    }
    setDisplay(formatted);
    setEquation('');
    setIsReset(true);
    dotPressedRef.current = false;
  }, [equation, display, exponentMode, composeSciValue, calculateResult]);

  const handleScientific = useCallback(
    (func: string) => {
      if (!isOn) return;

      let val: number;
      if (exponentMode) {
        val = composeSciValue();
        setExponentMode(false);
        setExponentDigits('');
        setExponentSign(1);
      } else {
        val = parseDisplay(display);
      }

      let result: number;

      switch (func) {
        case 'sqrt':
          result = Math.sqrt(val);
          break;
        case 'sqr':
          result = val * val;
          break;
        case 'inv':
          result = 1 / val;
          break;
        case 'sin':
          result = Math.sin(val * Math.PI / 180);
          break;
        case 'cos':
          result = Math.cos(val * Math.PI / 180);
          break;
        case 'tan':
          result = Math.tan(val * Math.PI / 180);
          break;
        case 'asin':
          result = Math.asin(val) * 180 / Math.PI;
          break;
        case 'acos':
          result = Math.acos(val) * 180 / Math.PI;
          break;
        case 'atan':
          result = Math.atan(val) * 180 / Math.PI;
          break;
        case 'log':
          result = Math.log10(val);
          break;
        case 'ln':
          result = Math.log(val);
          break;
        case 'exp':
          result = Math.exp(val);
          break;
        case 'pow10':
          result = Math.pow(10, val);
          break;
        case 'pi':
          result = Math.PI;
          break;
        case 'abs':
          result = Math.abs(val);
          break;
        case 'chs':
          result = -val;
          break;
        default:
          return;
      }

      setDisplay(formatResult(result));
      setIsReset(true);
      dotPressedRef.current = false;
    },
    [display, isOn, exponentMode, composeSciValue]
  );

  const handleClear = useCallback(() => {
    setDisplay('0.');
    setEquation('');
    setIsReset(false);
    setExponentMode(false);
    setExponentDigits('');
    setExponentSign(1);
    dotPressedRef.current = false;
    mantissaRef.current = '0.';
  }, []);

  const handleCLX = useCallback(() => {
    setDisplay('0.');
    setExponentMode(false);
    setExponentDigits('');
    setExponentSign(1);
    dotPressedRef.current = false;
    mantissaRef.current = '0.';
  }, []);

  const handleStore = useCallback(() => {
    setMemory(parseFloat(display.endsWith('.') ? display.slice(0, -1) : display));
    setIsReset(true);
    dotPressedRef.current = false;
  }, [display]);

  const handleRecall = useCallback(() => {
    let strRes = memory.toString();
    if (!strRes.includes('.')) strRes += '.';
    setDisplay(strRes);
    setIsReset(true);
    dotPressedRef.current = strRes.includes('.');
  }, [memory]);

  const executeAction = useCallback(
    (action: Action) => {
      switch (action.type) {
        case 'number':
          handleNumber(action.val!);
          break;
        case 'operator':
          handleOperator(action.val!);
          break;
        case 'sci':
          handleScientific(action.val!);
          break;
        case 'store':
          handleStore();
          break;
        case 'recall':
          handleRecall();
          break;
        case 'clx':
          handleCLX();
          break;
        case 'clear':
          handleClear();
          break;
        case 'equal':
          handleEqual();
          break;
        case 'eex':
          if (exponentMode) return;
          mantissaRef.current = display;
          setExponentDigits('');
          setExponentSign(1);
          setExponentMode(true);
          setIsReset(false);
          dotPressedRef.current = false;
          break;
        case 'open_paren':
          setDisplay(prev => (prev === '0.' ? '(' : prev + '('));
          break;
        case 'close_paren':
          setDisplay(prev => prev + ')');
          break;
      }
    },
    [
      display,
      handleNumber,
      handleOperator,
      handleScientific,
      handleStore,
      handleRecall,
      handleCLX,
      handleClear,
      handleEqual,
      exponentMode,
    ]
  );

  const handleSST = useCallback(() => {
    if (prgmMode) {
      setPrgmPointer(prev => Math.min(prev + 1, program.length));
    } else {
      if (prgmPointer < program.length) {
        const step = program[prgmPointer];
        executeAction({
          type: step.split(' ')[0] as Action['type'],
          val: step.split(' ')[1],
          label: step,
        });
        setPrgmPointer(prev => prev + 1);
      }
    }
  }, [prgmMode, prgmPointer, program, executeAction]);

  const handleBST = useCallback(() => {
    setPrgmPointer(prev => Math.max(prev - 1, 0));
  }, []);

  const handleGTO = useCallback(() => {
    setPrgmPointer(0);
    if (!prgmMode) {
      setDisplay('0.');
    }
  }, [prgmMode]);

  const handleClearPrgm = useCallback(() => {
    setProgram([]);
    setPrgmPointer(0);
  }, []);

  const handleRunStop = useCallback(() => {
    if (isRunningPrgm) {
      runIdRef.current += 1;
      isRunningRef.current = false;
      setIsRunningPrgm(false);
    } else {
      runIdRef.current += 1;
      isRunningRef.current = true;
      setIsRunningPrgm(true);

      const runId = runIdRef.current;
      let currentPointer = prgmPointer;
      if (currentPointer >= program.length) {
        currentPointer = 0;
      }

      const run = async () => {
        while (currentPointer < program.length && isRunningRef.current && runIdRef.current === runId) {
          setPrgmPointer(currentPointer);
          const step = program[currentPointer];
          const parts = step.split(' ');
          executeAction({
            type: parts[0] as Action['type'],
            val: parts[1],
            label: step,
          });
          currentPointer++;
          setPrgmPointer(currentPointer);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (runIdRef.current === runId) {
          setIsRunningPrgm(false);
          isRunningRef.current = false;
        }
      };

      run();
    }
  }, [isRunningPrgm, prgmPointer, program, executeAction]);

  const recordStep = useCallback(
    (action: Action) => {
      setProgram(prev => {
        const next = [...prev];
        next[prgmPointer] = `${action.type}${action.val ? ' ' + action.val : ''}`;
        return next;
      });
      setPrgmPointer(prev => prev + 1);
    },
    [prgmPointer]
  );

  const handleAction = useCallback(
    (action: Action) => {
      if (!isOn) return;

      triggerFeedback();

      let currentShift = shift;
      setShift(null);

      if (currentShift === 'f') {
        if (action.type === 'store') {
          handleSST();
          return;
        }
        if (action.type === 'clx') {
          handleGTO();
          return;
        }
        if (action.type === 'clear') {
          handleClearPrgm();
          return;
        }
      }

      if (currentShift === 'g') {
        if (action.type === 'recall') {
          handleBST();
          return;
        }
      }

      if (action.type === 'runstop') {
        handleRunStop();
        return;
      }

      if (exponentMode && action.type === 'sci' && action.val === 'chs') {
        const newSign = exponentSign === 1 ? -1 : 1;
        setExponentSign(newSign);
        const mantissaDisplay = mantissaRef.current === '0' ? '0.' : mantissaRef.current;
        const signStr = newSign === -1 ? '-' : ' ';
        setDisplay(`${mantissaDisplay}${signStr}${exponentDigits.padStart(2, '0')}.`);
        return;
      }

      if (currentShift === 'f') {
        executeAction({ ...action, val: action.val, label: action.label });
        return;
      }

      if (prgmMode) {
        recordStep(action);
        return;
      }

      executeAction(action);
    },
    [
      isOn,
      shift,
      exponentMode,
      exponentSign,
      exponentDigits,
      prgmMode,
      triggerFeedback,
      handleSST,
      handleGTO,
      handleClearPrgm,
      handleBST,
      handleRunStop,
      recordStep,
      executeAction,
    ]
  );

  const togglePower = useCallback(() => {
    setIsOn(prev => {
      const next = !prev;
      if (!next) {
        setPrgmMode(false);
        setPrgmPointer(0);
        setDisplay('0.');
        setEquation('');
        setExponentMode(false);
        setExponentDigits('');
        setExponentSign(1);
        dotPressedRef.current = false;
        mantissaRef.current = '0.';
        setIsRunningPrgm(false);
        isRunningRef.current = false;
      }
      return next;
    });
  }, []);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled(prev => !prev);
  }, []);

  const togglePrgm = useCallback(() => {
    if (!isOn) return;
    setPrgmMode(prev => {
      const next = !prev;
      setPrgmPointer(0);
      if (prev) {
        setDisplay('0.');
      }
      return next;
    });
  }, [isOn]);

  const toggleShift = useCallback((mode: 'f' | 'g') => {
    setShift(prev => prev === mode ? null : mode);
  }, []);

  const getSciParts = useCallback(() => {
    if (!exponentMode) return null;
    const mantissa = mantissaRef.current === '0' ? '0.' : mantissaRef.current;
    const sign = exponentSign === -1 ? '-' : ' ';
    return { mantissa, sign, exponent: exponentDigits };
  }, [exponentMode, exponentSign, exponentDigits]);

  return {
    display: computedDisplay,
    equation,
    shift,
    isOn,
    prgmMode,
    isRunningPrgm,
    vibrationEnabled,
    exponentMode,
    exponentDigits,
    exponentSign,
    program,
    prgmPointer,
    switchAnim,
    prgmAnim,
    vibAnim,
    handleAction,
    togglePower,
    toggleVibration,
    togglePrgm,
    toggleShift,
    getSciParts,
  };
}
