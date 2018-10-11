const { Tokens, GRPCKeywords, GRPCTypes } = require('./constants');

const tokenizer = input => {
  let current = 0;
  let tokens = [];

  const peek = (increment = 1) => input[current + increment];

  while (current < input.length) {
    let char = input[current];

    if (char === '{') {
      tokens.push({ type: Tokens.Bracket, value: '{' });
      current++;
      continue;
    }

    if (char === '}') {
      tokens.push({ type: Tokens.Bracket, value: '}' });
      current++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: Tokens.Parenthesis, value: '(' });
      current++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: Tokens.Parenthesis, value: ')' });
      current++;
      continue;
    }

    const IGNORE = /\s|=|,|:/;
    if (IGNORE.test(char)) {
      current++;
      continue;
    }

    if (char === ';') {
      tokens.push({ type: Tokens.Break, value: ';' });
      current++;
      continue;
    }

    if (char === '"') {
      let value = '';
      char = input[++current];
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      char = input[++current];
      tokens.push({ type: Tokens.String, value });
      continue;
    }

    const OPTION = /optional = [-.\w]+/;
    if (char === '[') {
      let value = '';
      char = input[++current];
      while (char !== ']' || peek() !== ';') {
        value += char;
        char = input[++current];
      }
      const option = OPTION.exec(value)[0].replace('optional = ', '');
      tokens.push({ type: Tokens.Optional, value: option });
      char = input[++current];
      continue;
    }

    if (char === '/') {
      const next = input[current + 1];
      if (next === '/') {
        while (char !== '\n') {
          char = input[++current];
        }
      }
      const walkComment = () => {
        while (char !== '*') {
          char = input[++current];
        }
        char = input[++current];
        if (char === '/') {
          char = input[++current];
        } else {
          walkComment();
        }
      };
      if (next === '*') walkComment();
      char = input[++current];
      continue;
    }

    if (char === '<') {
      tokens.push({ type: Tokens.MapBracket, value: '<' });
      current++;
      continue;
    }

    if (char === '>') {
      tokens.push({ type: Tokens.MapBracket, value: '>' });
      current++;
      continue;
    }

    const LETTERS = /[a-z0-9.]/i;
    const TERMINATORS = /\s|\)|}|<|>|,|]|;|\(/;

    if (LETTERS.test(char)) {
      let value = '';
      while (!TERMINATORS.test(char)) {
        value += char;
        char = input[++current];
      }
      const getType = val => {
        if (!isNaN(value)) return Tokens.Number;
        if (GRPCKeywords.includes(val)) return Tokens.Keyword;
        if (GRPCTypes.includes(val)) return Tokens.Type;
        return Tokens.Identifier;
      };
      tokens.push({ type: getType(value), value });
      continue;
    }

    throw new TypeError('I dont know what this character is: ' + char);
  }

  return tokens;
};

module.exports = tokenizer;
