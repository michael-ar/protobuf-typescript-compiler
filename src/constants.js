const Tokens = {
  Bracket: 'bracket',
  MapBracket: 'mapBracket',
  Parenthesis: 'parenthesis',
  Break: 'break',
  Number: 'number',
  String: 'string',
  Optional: 'optional',
  Type: 'type',
  Keyword: 'keyword',
  Identifier: 'identifier',
};

const Types = {
  NumberLiteral: 'NumberLiteral',
  StringLiteral: 'StringLiteral',
  ImportDeclaration: 'ImportDeclaration',
  SyntaxDeclaration: 'SyntaxDeclaration',
  PackageDeclaration: 'PackageDeclaration',
  Program: 'Program',
  Service: 'Service',
  Module: 'Module',
  UnusedModule: 'UnusedModule',
  Message: 'Message',
  RPC: 'RPC',
  Method: 'Method',
  CustomType: 'CustomType',
  Type: 'Type',
  Enum: 'Enum',
  Field: 'Field',
  Oneof: 'Oneof',
  Map: 'Map',
  HTTPOption: 'HTTPOption',
};

const GRPCKeywords = [
  'enum',
  'message',
  'syntax',
  'import',
  'package',
  'repeated',
  'reserved',
  'service',
  'rpc',
  'returns',
  'option',
];

const GRPCTypes = [
  'string',
  'map',
  'oneof',
  'int32',
  'int64',
  'float',
  'double',
  'bool',
];

module.exports = { Tokens, Types, GRPCKeywords, GRPCTypes };
