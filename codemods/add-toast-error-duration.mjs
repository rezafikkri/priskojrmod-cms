/**
 * Add duration configuration to toast.error calls using cmsConfig.
 * 
 * This codemod adds `{ duration: cmsConfig.toast.duration.error }` 
 * as the second argument to all toast.error() calls.
 * 
 * Usage:
 *   pnpm exec jscodeshift -t codemods/add-toast-error-duration.mjs components --extensions=jsx
 * 
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  
  let modified = false;

  // Cari semua toast.error() calls
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'toast' },
        property: { name: 'error' }
      }
    })
    .forEach(path => {
      const args = path.node.arguments;
      
      // Case 1: Hanya 1 argumen (belum ada options)
      if (args.length === 1) {
        const durationConfig = j.objectExpression([
          j.property(
            'init',
            j.identifier('duration'),
            j.memberExpression(
              j.memberExpression(
                j.memberExpression(
                  j.identifier('cmsConfig'),
                  j.identifier('toast')
                ),
                j.identifier('duration')
              ),
              j.identifier('error')
            )
          )
        ]);
        
        args.push(durationConfig);
        modified = true;
      }
      // Case 2: Sudah ada 2 argumen (options sudah ada)
      else if (args.length === 2 && args[1].type === 'ObjectExpression') {
        const optionsObj = args[1];
        
        // Cek apakah sudah ada property 'duration'
        const hasDuration = optionsObj.properties.some(
          prop => prop.key && prop.key.name === 'duration'
        );
        
        if (!hasDuration) {
          // Tambahkan duration property
          optionsObj.properties.push(
            j.property(
              'init',
              j.identifier('duration'),
              j.memberExpression(
                j.memberExpression(
                  j.memberExpression(
                    j.identifier('cmsConfig'),
                    j.identifier('toast')
                  ),
                  j.identifier('duration')
                ),
                j.identifier('error')
              )
            )
          );
          modified = true;
        }
      }
    });

  if (!modified) {
    return null;
  }

  // Cek apakah sudah ada import dari '@/config/cms'
  const hasExistingImport = root
    .find(j.ImportDeclaration, {
      source: { value: '@/config/cms' }
    })
    .size() > 0;

  if (!hasExistingImport) {
    // Buat import statement baru
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier('cmsConfig'))],
      j.literal('@/config/cms')
    );

    // Cari semua import declarations
    const imports = root.find(j.ImportDeclaration);

    if (imports.size() > 0) {
      // Insert setelah import terakhir
      const lastImport = imports.at(-1);
      const lastImportNode = lastImport.get().node;
      if (!lastImportNode.trailingComments) {
        lastImportNode.trailingComments = [];
      }
      lastImport.insertAfter(newImport);
    } else {
      // Kalau belum ada import, insert setelah 'use client' (jika ada)
      const body = root.find(j.Program).get('body');
      let insertIndex = 0;
      
      const firstNode = body.value[0];
      if (firstNode && 
          firstNode.type === 'ExpressionStatement' && 
          firstNode.expression.type === 'Literal' &&
          firstNode.expression.value === 'use client') {
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
