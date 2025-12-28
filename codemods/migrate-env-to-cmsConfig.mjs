/**
 * Migrate environment variable access to cmsConfig.
 * 
 * This codemod replaces process.env.* access for specific variables
 * with their new cmsConfig equivalents and adds import if needed.
 * 
 * Usage:
 *   pnpm exec jscodeshift -t codemods/migrate-env-to-cmsConfig.mjs components --extensions=jsx
 * 
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  
  // Mapping from env variable name to cmsConfig path
  const envToCmsConfig = {
    'NEXT_PUBLIC_PAGE_SIZE': ['pagination', 'pageSize'],
    'SEARCH_LIMIT': ['search', 'limit'],
    'PRODUCT_PINNED_LIMIT': ['product', 'pinnedLimit'],
    'NEXT_PUBLIC_DEFAULT_DATA_LANG': ['defaults', 'language'],
    'NEXT_PUBLIC_DEFAULT_DATA_CURR': ['defaults', 'currency'],
    'NEXT_PUBLIC_MAX_DEVICE_RESETS_PER_PERIOD': ['deviceReset', 'maxResetsPerPeriod']
  };
  
  // Env variables that are strings (don't need parseInt removal)
  const stringEnvVars = [
    'NEXT_PUBLIC_DEFAULT_DATA_LANG',
    'NEXT_PUBLIC_DEFAULT_DATA_CURR'
  ];
  
  let modified = false;

  // Find all process.env.* member expressions
  root
    .find(j.MemberExpression, {
      object: {
        type: 'MemberExpression',
        object: { name: 'process' },
        property: { name: 'env' }
      }
    })
    .forEach(path => {
      const propertyName = path.node.property.name;
      
      // Check if this env variable is in our migration list
      if (envToCmsConfig[propertyName]) {
        const configPath = envToCmsConfig[propertyName];
        
        // Build nested member expression: cmsConfig.path.to.value
        let memberExpr = j.identifier('cmsConfig');
        configPath.forEach(segment => {
          memberExpr = j.memberExpression(memberExpr, j.identifier(segment));
        });
        
        // Check if this process.env.* is wrapped in parseInt()
        const parent = path.parent;
        const isWrappedInParseInt = parent.value.type === 'CallExpression' &&
                                    parent.value.callee.name === 'parseInt' &&
                                    parent.value.arguments[0] === path.node;
        
        if (isWrappedInParseInt && !stringEnvVars.includes(propertyName)) {
          // Remove parseInt wrapper, replace with just cmsConfig access
          j(parent).replaceWith(memberExpr);
        } else {
          // Replace the entire process.env.* with cmsConfig.*
          j(path).replaceWith(memberExpr);
        }
        
        modified = true;
      }
    });

  // If no env variables were replaced, return null
  if (!modified) {
    return null;
  }

  // Check if import from '@/config/cms' already exists
  const hasExistingImport = root
    .find(j.ImportDeclaration, {
      source: { value: '@/config/cms' }
    })
    .size() > 0;

  // Add import only if it doesn't exist
  if (!hasExistingImport) {
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier('cmsConfig'))],
      j.literal('@/config/cms')
    );

    const imports = root.find(j.ImportDeclaration);

    if (imports.size() > 0) {
      const lastImport = imports.at(-1);
      const lastImportNode = lastImport.get().node;
      if (!lastImportNode.trailingComments) {
        lastImportNode.trailingComments = [];
      }
      lastImport.insertAfter(newImport);
    } else {
      const body = root.find(j.Program).get('body');
      let insertIndex = 0;
      
      const firstNode = body.value[0];
      if (firstNode && 
          firstNode.type === 'ExpressionStatement' && 
          firstNode.expression.type === 'Literal' &&
          (firstNode.expression.value === 'use client' || 
           firstNode.expression.value === 'use server')) {
        insertIndex = 1;
      }
      
      body.value.splice(insertIndex, 0, newImport);
    }
  }

  return root.toSource({ quote: 'single' }).replace(
    /^(import .+\n)\n(import { cmsConfig } from '@\/config\/cms';)/m,
    '$1$2'
  );
}
