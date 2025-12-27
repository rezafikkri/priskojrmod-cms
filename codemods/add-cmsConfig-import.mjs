/**
 * Add missing cmsConfig import from '@/config/cms'
 * 
 * This codemod adds `import { cmsConfig } from '@/config/cms'`
 * to files that use cmsConfig but haven't imported it yet.
 * 
 * Usage:
 *   pnpm exec jscodeshift -t codemods/add-cmsConfig-import.mjs components --extensions=jsx
 *
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Cek apakah file menggunakan identifier 'cmsConfig'
  const usesCmsConfig = root
    .find(j.Identifier, { name: 'cmsConfig' })
    .size() > 0;

  if (!usesCmsConfig) {
    return null;
  }

  // Cek apakah sudah ada import dari '@/config/cms'
  const hasExistingImport = root
    .find(j.ImportDeclaration, {
      source: { value: '@/config/cms' }
    })
    .size() > 0;

  if (hasExistingImport) {
    return null;
  }

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
    
    // Hilangkan trailing newline dari import terakhir
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

  return root.toSource({ quote: 'single' }).replace(
    /^(import .+\n)\n(import { cmsConfig } from '@\/config\/cms';)/m,
    '$1$2'
  );
}
