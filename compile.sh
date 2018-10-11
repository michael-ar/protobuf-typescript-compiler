mkdir output
rm output/*ts
node ./src/index.js $1
prettier output/*.ts --write