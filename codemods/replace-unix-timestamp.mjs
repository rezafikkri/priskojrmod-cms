/**
 * Replaces Math.floor(new Date().getTime() / 1000) with getUnixTimestamp()
 *
 * Usage:
 *   pnpm exec jscodeshift -t codemods/replace-unix-timestamp.mjs components --extensions=js,jsx
 *
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  // Match: Math.floor(new Date().getTime() / 1000)
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'Math' },
        property: { name: 'floor' },
      },
    })
    .filter((path) => {
      const args = path.node.arguments;
      if (args.length !== 1 || args[0].type !== 'BinaryExpression') return false;

      const binary = args[0];
      if (binary.operator !== '/' || binary.right.type !== 'Literal' || binary.right.value !== 1000) return false;

      const left = binary.left;
      if (left.type !== 'CallExpression') return false;
      if (left.callee.type !== 'MemberExpression') return false;
      if (left.callee.property.name !== 'getTime') return false;

      const newDate = left.callee.object;
      if (newDate.type !== 'NewExpression') return false;
      if (newDate.callee.name !== 'Date') return false;
      if (newDate.arguments.length !== 0) return false;

      return true;
    })
    .forEach((path) => {
      j(path).replaceWith(j.callExpression(j.identifier('getUnixTimestamp'), []));
      modified = true;
    });

  if (!modified) {
    return null;
  }

  // Check if an existing utils import is present (alias or relative)
  const utilsPaths = ['@/lib/utils', '../utils'];
  let existingUtilsImport = null;

  for (const utilsPath of utilsPaths) {
    const found = root.find(j.ImportDeclaration, { source: { value: utilsPath } });
    if (found.size() > 0) {
      existingUtilsImport = found.at(0);
      break;
    }
  }

  if (existingUtilsImport) {
    // Check if getUnixTimestamp is already a named specifier
    const node = existingUtilsImport.get().node;
    const alreadyImported = node.specifiers.some(
      (s) => s.type === 'ImportSpecifier' && s.imported.name === 'getUnixTimestamp'
    );

    if (!alreadyImported) {
      node.specifiers.push(j.importSpecifier(j.identifier('getUnixTimestamp')));
    }
  } else {
    // No utils import found — create a new one
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier('getUnixTimestamp'))],
      j.literal('@/lib/utils')
    );

    const imports = root.find(j.ImportDeclaration);

    if (imports.size() > 0) {
      imports.at(-1).insertAfter(newImport);
    } else {
      // No imports exist — insert after 'use client' / 'use server' / 'server only' if present
      const body = root.find(j.Program).get('body');
      let insertIndex = 0;

      const firstNode = body.value[0];
      if (
        firstNode &&
        firstNode.type === 'ExpressionStatement' &&
        firstNode.expression.type === 'Literal' &&
        (firstNode.expression.value === 'use client' ||
          firstNode.expression.value === 'use server' ||
          firstNode.expression.value === 'server only')
      ) {
        insertIndex = 1;
      }

      body.value.splice(insertIndex, 0, newImport);
    }
  }

  let output = root.toSource({ quote: 'single' });

  // Remove blank line between last existing import and our new import
  output = output.replace(
    /^(import .+\n)\n(import { getUnixTimestamp } from '@\/lib\/utils';)/m,
    '$1$2'
  );

  // Ensure blank line between directive and our new import (when no other imports exist)
  output = output.replace(
    /^(['"](?:use client|use server|server only)['"];)\n(import { getUnixTimestamp } from '@\/lib\/utils';)/m,
    '$1\n\n$2'
  );

  return output;
}
