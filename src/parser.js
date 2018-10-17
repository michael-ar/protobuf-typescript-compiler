const fs = require('fs');
const path = require('path');
const tokenizer = require('./tokenizer');
const { Tokens, Types } = require('./constants');

const typeMap = {
  'paybase.protobuf.Struct': 'object',
  'google.protobuf.Timestamp': 'Date',
  'google.protobuf.Empty': '{}',
  'document.Create': 'Create',
  bool: 'boolean',
  bytes: 'string',
};

const sentenceCase = string => string.charAt(0).toUpperCase() + string.slice(1);

const isArgumentEnd = token =>
  token.type === Tokens.Parenthesis && token.value === ')';
const isBlockEnd = token =>
  token.type === Tokens.Bracket && token.value === '}';
const isLineBreak = token => token.type === Tokens.Break;
const isField = token =>
  token.type === Tokens.Type ||
  (token.type === Tokens.Keyword && token.value === 'repeated') ||
  token.type === Tokens.Identifier;

const parser = (tokens, resolvedModules = new Map(), root) => {
  let current = 0;

  const walk = () => {
    let token = tokens[current];
    const next = (increment = 1) => (
      (token = tokens[current + increment]), (current = current + increment)
    );
    const peek = (increment = 1) => tokens[current + increment];

    if (token.type === Tokens.Number) {
      current++;
      return {
        type: Types.NumberLiteral,
        value: token.value,
      };
    }

    if (token.type === Tokens.String) {
      current++;
      return {
        type: Types.StringLiteral,
        value: token.value,
      };
    }

    const type = () => {
      switch (token.value) {
        case 'string':
        case 'int32':
        case 'int64':
        case 'float':
        case 'double':
        case 'bool': {
          return {
            type: Types.Type,
            value: typeMap[token.value] || token.value,
          };
        }
        case 'map': {
          const value = {
            type: Types.Map,
          };
          next();
          while (token.type !== Tokens.MapBracket || token.value !== '>') {
            if (
              token.type === Tokens.Type ||
              token.type === Tokens.Identifier
            ) {
              value[value.key ? 'value' : 'key'] = type();
            }
            next();
          }
          return value;
        }
        default: {
          return {
            type: Types.CustomType,
            value: typeMap[token.value] || token.value,
          };
        }
      }
    };

    const field = () => {
      const node = {
        type: Types.Field,
      };
      const walkField = () => {
        const name = () => (node.name = token.value);
        const optional = () =>
          (node.optional = token.value === 'true' ? true : false);
        const repeated = () => (node.repeated = true);

        switch (token.type) {
          case Tokens.Type: {
            node.value = type();
            break;
          }
          case Tokens.Optional: {
            optional();
            break;
          }
          case Tokens.Keyword: {
            repeated();
            break;
          }
          case Tokens.Identifier: {
            const isCustomtype = tokens[current + 1].type === Tokens.Identifier;
            isCustomtype ? (node.value = type()) : name();
            break;
          }
        }
      };
      while (!isLineBreak(token)) {
        walkField();
        next();
      }
      current++;
      return node;
    };

    const rpc = () => {
      const node = {
        type: Types.RPC,
        name: token.value,
      };
      next();
      const walkRPC = () => {
        const argument = () => {
          while (!isArgumentEnd(token)) {
            if (token.type !== Tokens.Parenthesis) {
              node[node.takes ? 'returns' : 'takes'] = type();
            }
            next();
          }
        };

        const option = () => {
          const isHTTPOption =
            peek().type === Tokens.Parenthesis &&
            peek(2).value === 'google.api.http';
          if (isHTTPOption) {
            const value = {
              type: Types.HTTPOption,
            };
            next(4);
            if (token.type === Tokens.Bracket) {
              next();
              (value.method = token.value.replace(':', '')), next();
              value.url = token.value;
            } else {
              (value.method = token.value.replace('.', '')), next();
              value.url = token.value;
            }
            node.http = value;
          }
        };

        switch (token.type) {
          case Tokens.Keyword: {
            if (token.value === 'option') option();
            break;
          }
          case Tokens.Parenthesis: {
            argument();
            break;
          }
        }
      };

      while (!isBlockEnd(token) || peek().type === Tokens.Break) {
        walkRPC();
        next();
      }
      current++;
      return node;
    };

    if (token.value === 'oneof') {
      next();
      const node = {
        type: Types.Oneof,
        name: token.value,
        children: [],
      };
      next(2);
      while (!isBlockEnd(token)) {
        node.children.push(walk());
        token = tokens[current];
      }
      current++;
      return node;
    }

    if (token.type === Tokens.Keyword) {
      switch (token.value) {
        case 'import': {
          next();
          if (token.value.startsWith('messages')) {
            const moduleName = token.value;
            const node = {
              type: Types.Module,
              name: moduleName,
            };
            if (!resolvedModules.has(moduleName)) {
              resolvedModules.set(moduleName, {});
              const filepath = path.resolve(root, moduleName);
              const file = fs.readFileSync(filepath, { encoding: 'utf8' });
              const output = parser(tokenizer(file), resolvedModules, root);
              resolvedModules.set(moduleName, output);
              node.body = output;
            } else {
              node.body = resolvedModules.get(moduleName);
            }
            next(2);
            return node;
          }
          next(2);
          return {
            type: Types.UnusedModule,
          };
        }
        case 'syntax':
        case 'package': {
          const node = {
            type: `${sentenceCase(token.value)}Declaration`,
          };
          while (!isLineBreak(token)) {
            node.value = token.value;
            next();
          }
          current++;
          return node;
        }
        case 'enum': {
          next();
          const node = {
            type: Types.Enum,
            name: token.value,
            fields: [],
          };
          while (token.type !== Tokens.Bracket) {
            const field = {};
            while (!isLineBreak(token)) {
              if (token.type === Tokens.Identifier) field.value = token.value;
              if (token.type === Tokens.Number) field.position = token.value;
              next();
            }
            next();
            node.fields.push(field);
          }
          current++;
          return node;
        }
        case 'service':
        case 'message': {
          const type = sentenceCase(token.value);
          next();
          const node = {
            type: Types[type],
            name: token.value,
            export: true,
            nodes: [],
          };
          next(2);
          while (!isBlockEnd(token)) {
            node.nodes.push(walk());
            token = tokens[current];
          }
          current++;
          return node;
        }
        case 'rpc': {
          next();
          return rpc();
        }
      }
    }

    if (isField(token)) return field();
    throw new TypeError(`${token.type}, ${token.value}`);
  };
  let ast = {
    type: Types.Program,
    body: [],
  };
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
};

module.exports = parser;
