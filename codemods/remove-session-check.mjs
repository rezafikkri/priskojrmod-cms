/**
 * Remove session null check with UnauthenticatedError throw after verifySession call
 * 
 * Usage:
 *   pnpm exec jscodeshift -t codemods/remove-session-check.mjs lib/services --extensions=js
 * 
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  
  let modified = false;

  root.find(j.VariableDeclaration).forEach(path => {
    const declaration = path.node.declarations[0];
    
    if (!declaration || !declaration.init) return;
    
    const init = declaration.init;
    
    let isVerifySessionCall = false;
    
    if (init.type === 'AwaitExpression') {
      if (init.argument?.type === 'CallExpression' &&
          init.argument?.callee?.name === 'verifySession') {
        isVerifySessionCall = true;
      }
    } else if (init.type === 'CallExpression') {
      if (init.callee?.name === 'verifySession') {
        isVerifySessionCall = true;
      }
    }
    
    if (!isVerifySessionCall) return;
    
    const sessionVarName = declaration.id.name;
    const parentPath = path.parent;
    let found = false;
    
    j(parentPath).find(j.IfStatement).forEach(ifPath => {
      if (found) return;
      
      const ifParent = ifPath.parent;
      if (ifParent !== parentPath) return;
      
      const test = ifPath.node.test;
      const isNegationCheck = 
        test?.type === 'UnaryExpression' &&
        test?.operator === '!' &&
        test?.argument?.name === sessionVarName;
      
      if (!isNegationCheck) return;
      
      const consequent = ifPath.node.consequent;
      let throwStatement = null;
      
      if (consequent.type === 'ThrowStatement') {
        throwStatement = consequent;
      } else if (consequent.type === 'BlockStatement' && 
                 consequent.body?.length === 1 &&
                 consequent.body[0]?.type === 'ThrowStatement') {
        throwStatement = consequent.body[0];
      }
      
      if (!throwStatement) return;
      
      const isUnauthenticatedError = 
        throwStatement.argument?.type === 'NewExpression' &&
        throwStatement.argument?.callee?.name === 'UnauthenticatedError';
      
      if (!isUnauthenticatedError) return;
      
      j(ifPath).remove();
      modified = true;
      found = true;
    });
    
    if (found) {
      let functionScope = path.scope;
      while (functionScope && functionScope.node.type !== 'FunctionDeclaration' && 
             functionScope.node.type !== 'FunctionExpression' && 
             functionScope.node.type !== 'ArrowFunctionExpression') {
        functionScope = functionScope.parent;
      }
      
      if (functionScope) {
        const isSessionUsed = j(functionScope.path)
          .find(j.Identifier, { name: sessionVarName })
          .filter(idPath => {
            return idPath.parent.node !== declaration;
          })
          .size() > 0;
        
        if (!isSessionUsed) {
          const expressionStatement = j.expressionStatement(init);
          j(path).replaceWith(expressionStatement);
        }
      }
    }
  });

  if (modified) {
    const hasUnauthenticatedErrorUsage = root
      .find(j.Identifier, { name: 'UnauthenticatedError' })
      .filter(path => {
        return path.parent.node.type !== 'ImportDefaultSpecifier';
      })
      .size() > 0;

    if (!hasUnauthenticatedErrorUsage) {
      root.find(j.ImportDeclaration, {
        source: { value: '../errors/UnauthenticatedError' }
      }).remove();
    }
  }

  if (!modified) {
    return null;
  }

  return root.toSource({ quote: 'single' });
}
