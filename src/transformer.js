const { Types } = require('./constants');
const traverser = require('./traverser');

function transformer(ast) {
  let newAst = {
    type: 'Program',
    body: [],
    modules: {},
  };

  const noTransform = (node, parent) => parent._context.push(node);
  ast._context = newAst.body;
  ast._modules = newAst.modules;

  traverser(ast, {
    SyntaxDeclaration: {
      enter(node, parent) {
        parent._context.push({
          type: 'SyntaxDeclaration',
          value: node.value,
        });
      },
    },
    Module: {
      enter(node, parent) {
        if (!node._context) node._context = [];
        newAst.modules[node.name] = node;
      },
    },

    Enum: {
      enter: noTransform,
    },

    Message: {
      enter(node, parent) {
        const oneofs = node.nodes.filter(x => x.type === Types.Oneof);
        if (oneofs.length) {
          const messages = oneofs.reduce((acc, v) => {
            const m = v.children.map(x => ({
              type: Types.Message,
              name: x.name,
              export: false,
              nodes: [
                { ...x, optional: false },
                {
                  type: Types.Field,
                  name: v.name,
                  value: {
                    type: Types.CustomType,
                    value: `'${x.name}'`,
                  },
                },
              ],
            }));
            acc.concat(m);
            return acc.concat(m);
          }, []);
          parent.body.body = parent.body.body.concat(messages);
        }
      },
    },

    Service: {
      enter: noTransform,
    },
  });

  // At the end of our transformer function we'll return the new ast that we
  // just created.
  const unnestModules = Object.values(newAst.modules).map(x => x.body);
  const mergedModules = unnestModules.reduce((acc, mod) => {
    const name = mod.body.find(x => x.type === 'PackageDeclaration').value;
    if (!acc[name]) acc[name] = mod;
    else {
      acc[name].body = acc[name].body.concat(mod.body);
    }
    return acc;
  }, {});
  const deduped = Object.entries(mergedModules).reduce((acc, [k, v]) => {
    const dedupedMod = v.body.reduce(
      (acc, v, i) => ((acc[v.name || i] = v), acc),
      {},
    );
    v.body = Object.values(dedupedMod);
    acc[k] = v;
    return acc;
  }, {});
  newAst.modules = Object.values(deduped);
  return newAst;
}

module.exports = transformer;
