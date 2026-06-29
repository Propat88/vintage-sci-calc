type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'func'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sin: x => Math.sin(x * Math.PI / 180),
  cos: x => Math.cos(x * Math.PI / 180),
  tan: x => Math.tan(x * Math.PI / 180),
  asin: x => Math.asin(x) * 180 / Math.PI,
  acos: x => Math.acos(x) * 180 / Math.PI,
  atan: x => Math.atan(x) * 180 / Math.PI,
  log: x => Math.log10(x),
  ln: x => Math.log(x),
  sqrt: x => Math.sqrt(x),
  abs: x => Math.abs(x),
  exp: x => Math.exp(x),
  pow10: x => Math.pow(10, x),
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(ch) || ch === '.') {
      let numStr = '';
      let hasDot = false;
      while (i < len) {
        const c = input[i];
        if (/[0-9]/.test(c)) {
          numStr += c;
          i++;
        } else if (c === '.' && !hasDot) {
          numStr += c;
          hasDot = true;
          i++;
        } else {
          break;
        }
      }
      if (numStr === '' || numStr === '.') numStr = '0.';
      tokens.push({ type: 'number', value: parseFloat(numStr) });
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    if (ch === '+' || ch === '*' || ch === '/' || ch === '^' || ch === '×' || ch === '÷') {
      const opMap: Record<string, '+' | '*' | '/' | '^'> = {
        '+': '+',
        '*': '*',
        '/': '/',
        '^': '^',
        '×': '*',
        '÷': '/',
      };
      tokens.push({ type: 'op', value: opMap[ch] });
      i++;
      continue;
    }

    if (ch === '-') {
      const isUnary =
        tokens.length === 0 ||
        tokens[tokens.length - 1].type === 'op' ||
        tokens[tokens.length - 1].type === 'lparen';

      if (isUnary) {
        let j = i + 1;
        while (j < len && /\s/.test(input[j])) j++;

        if (j < len && (/[0-9]/.test(input[j]) || input[j] === '.')) {
          let numStr = '-';
          let hasDot = false;
          i = j;
          while (i < len) {
            const c = input[i];
            if (/[0-9]/.test(c)) {
              numStr += c;
              i++;
            } else if (c === '.' && !hasDot) {
              numStr += '.';
              hasDot = true;
              i++;
            } else {
              break;
            }
          }
          tokens.push({ type: 'number', value: parseFloat(numStr) });
          continue;
        }

        if (j < len && input[j] === '(') {
          tokens.push({ type: 'number', value: 0 });
          tokens.push({ type: 'op', value: '-' });
          i++;
          continue;
        }
      }

      tokens.push({ type: 'op', value: '-' });
      i++;
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      let name = '';
      while (i < len && /[a-zA-Z]/.test(input[i])) {
        name += input[i++];
      }

      if (name === 'pi') {
        tokens.push({ type: 'number', value: Math.PI });
      } else if (FUNCTIONS[name]) {
        tokens.push({ type: 'func', value: name });
      } else {
        throw new Error(`Unknown token: ${name}`);
      }
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  const precedence = (op: string) => {
    if (op === '^') return 4;
    if (op === '*' || op === '/') return 3;
    return 2;
  };

  const rightAssoc = (op: string) => op === '^';

  for (const token of tokens) {
    switch (token.type) {
      case 'number':
        output.push(token);
        break;
      case 'func':
        stack.push(token);
        break;
      case 'op': {
        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'op') {
            const p1 = precedence(token.value);
            const p2 = precedence(top.value);
            if (
              (rightAssoc(token.value) && p1 < p2) ||
              (!rightAssoc(token.value) && p1 <= p2)
            ) {
              output.push(stack.pop()!);
              continue;
            }
          }
          break;
        }
        stack.push(token);
        break;
      }
      case 'lparen':
        stack.push(token);
        break;
      case 'rparen': {
        while (stack.length > 0 && stack[stack.length - 1].type !== 'lparen') {
          output.push(stack.pop()!);
        }
        if (stack.length === 0) throw new Error('Mismatched parentheses');
        stack.pop();
        if (stack.length > 0 && stack[stack.length - 1].type === 'func') {
          output.push(stack.pop()!);
        }
        break;
      }
    }
  }

  while (stack.length > 0) {
    const t = stack.pop()!;
    if (t.type === 'lparen' || t.type === 'rparen') {
      throw new Error('Mismatched parentheses');
    }
    output.push(t);
  }

  return output;
}

function evalRPN(tokens: Token[]): number {
  const stack: number[] = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      stack.push(token.value);
    } else if (token.type === 'op') {
      if (token.value === '^') {
        const b = stack.pop()!;
        const a = stack.pop()!;
        stack.push(Math.pow(a, b));
      } else {
        const b = stack.pop()!;
        const a = stack.pop()!;
        switch (token.value) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            if (b === 0) throw new Error('Division by zero');
            stack.push(a / b);
            break;
        }
      }
    } else if (token.type === 'func') {
      const a = stack.pop()!;
      stack.push(FUNCTIONS[token.value](a));
    }
  }

  if (stack.length !== 1) throw new Error('Invalid expression');
  return stack[0];
}

export function safeEval(expr: string): number {
  const sanitized = expr.replace(/\s+/g, ' ').trim();
  const tokens = tokenize(sanitized);
  const rpn = toRPN(tokens);
  return evalRPN(rpn);
}
