const fs = require('fs');
const path = require('path');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const printer = require('./printer');

const entrypoint = fs.readFileSync(
  `${path.resolve(process.cwd(), process.argv[2])}`,
  { encoding: 'utf8' },
);

const compiler = input => {
  const tokens = tokenizer(input);
  const ast = parser(tokens, new Map(), process.argv[2]);
  const newAst = transformer(ast);
  const output = newAst.modules.map(printer);
  output.forEach((str, i) =>
    fs.writeFile(
      `${process.cwd()}/output/${newAst.modules[i].body
        .find(x => x.type === 'PackageDeclaration')
        .value.replace('paybase.', '')}.ts`,
      str,
      'utf8',
      err => {
        if (err) throw new Error(err);
      },
    ),
  );

  return output;
};

compiler(entrypoint);
