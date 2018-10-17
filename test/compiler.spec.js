const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const cwd = process.cwd();
const rm = name => fs.unlinkSync(path.resolve(cwd, `./output/${name}.ts`));
const read = filePath =>
  fs.readFileSync(path.resolve(cwd, `./${filePath}`), { encoding: 'utf8' });
const files = ['input', 'output', 'shared'];

beforeEach(() => {
  files.forEach(name => rm(name));
});

test('compiler produces expected output', () => {
  exec('./compile.sh ./test/protos ./v1/api.proto', () => {
    files.forEach(name =>
      expect(read(`./output/${name}.ts`)).toEqual(
        read(`./test/typescript/${name}.ts`),
      ),
    );
  });
});
