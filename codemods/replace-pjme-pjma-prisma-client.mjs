/**
 * Replace pjmeDBPrismaClient and pjmaDBPrismaClient with prisma.
 *
 * Usage:
 *   pnpm exec jscodeshift -t codemods/replace-pjme-pjma-prisma-client.mjs lib/services --extensions=js
 *
 * @param {import('jscodeshift').FileInfo} file
 * @param {import('jscodeshift').API} api
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const OLD_CLIENTS = [
    'pjmeDBPrismaClient',
    'pjmaDBPrismaClient'
  ];

  let modified = false;
  let prismaImportAdded = false;

  // Normalize model/property name
  // - Single word: lowercase
  // - Multiple words: lower camelCase
  function normalizePropertyName(name) {
    if (!/[A-Z]/.test(name.slice(1))) {
      return name.toLowerCase();
    }

    return name[0].toLowerCase() + name.slice(1);
  }

  // Replace usage in MemberExpression
  root.find(j.MemberExpression).forEach(path => {
    const { object, property, computed } = path.node;

    if (
      !computed &&
      object.type === 'Identifier' &&
      OLD_CLIENTS.includes(object.name) &&
      property.type === 'Identifier'
    ) {
      // Always replace object with prisma
      path.node.object = j.identifier('prisma');

      // Only normalize property name if it is not a $ method
      if (!property.name.startsWith('$')) {
        path.node.property = j.identifier(
          normalizePropertyName(property.name)
        );
      }

      modified = true;
    }
  });

  // Handle imports
  const prismaImport = root.find(j.ImportDeclaration, {
    source: { value: '../prisma' }
  });

  const oldImports = root.find(j.ImportDeclaration).filter(path =>
    path.node.source.value === '../pjme-prisma-client' ||
    path.node.source.value === '../pjma-prisma-client'
  );

  // Remove old prisma client imports if they exist
  if (oldImports.size() > 0) {
    oldImports.remove();
    modified = true;
  }

  // Add prisma import only if needed
  if (modified && prismaImport.size() === 0) {
    const newImport = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier('prisma'))],
      j.literal('../prisma')
    );

    const imports = root.find(j.ImportDeclaration);

    if (imports.size() > 0) {
      const lastImport = imports.at(-1);
      lastImport.insertAfter(newImport);
    } else {
      const body = root.find(j.Program).get('body');
      let insertIndex = 0;

      const firstNode = body.value[0];
      if (
        firstNode &&
        firstNode.type === 'ExpressionStatement' &&
        firstNode.expression.type === 'Literal' &&
        firstNode.expression.value === 'use server'
      ) {
        insertIndex = 1;
      }

      body.value.splice(insertIndex, 0, newImport);
    }

    prismaImportAdded = true;
  }

  if (!modified) {
    return null;
  }

  // Remove blank line only between the newly added prisma import and the import above it
  let output = root.toSource({ quote: 'single' });

  if (prismaImportAdded) {
    output = output.replace(
      /(import .+\n)\n(import prisma from '\.\.\/prisma';)/,
      '$1$2'
    );
  }

  return output;
}
