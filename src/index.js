const fs = require('fs');
const path = require('path');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const printer = require('./printer');

const [_, __, root, entrypoint] = process.argv;
const proto = fs.readFileSync(path.resolve(process.cwd(), root, entrypoint), {
  encoding: 'utf8',
});

const compiler = input => {
  const tokens = tokenizer(input);
  const ast = parser(tokens, new Map(), root);
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

compiler(proto);
