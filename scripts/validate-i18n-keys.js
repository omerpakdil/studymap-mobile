const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const MESSAGES_DIR = path.join(process.cwd(), 'app', 'i18n', 'messages');
const FILES = [
  'en.ts',
  'tr.ts',
  'ar.ts',
  'de.ts',
  'ja.ts',
  'ko.ts',
  'pt-BR.ts',
  'zh-Hans.ts',
];

function getObjectLiteralFromFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let objectNode = null;

  function visit(node) {
    const unwrapObjectLiteral = (init) => {
      if (!init) return null;
      if (ts.isObjectLiteralExpression(init)) return init;
      if (ts.isAsExpression(init) || ts.isTypeAssertionExpression(init) || ts.isParenthesizedExpression(init)) {
        return unwrapObjectLiteral(init.expression);
      }
      return null;
    };

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text.endsWith('Messages')
    ) {
      const initObject = unwrapObjectLiteral(node.initializer);
      if (initObject) {
        objectNode = initObject;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!objectNode) {
    throw new Error(`Could not find *Messages object in ${filePath}`);
  }

  return objectNode;
}

function getPropertyKeyName(nameNode) {
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) return String(nameNode.text);
  return null;
}

function collectLeafPaths(objectNode, basePath = '', out = new Set()) {
  for (const prop of objectNode.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;

    const key = getPropertyKeyName(prop.name);
    if (!key) continue;

    const currentPath = basePath ? `${basePath}.${key}` : key;
    const init = prop.initializer;

    if (ts.isObjectLiteralExpression(init)) {
      collectLeafPaths(init, currentPath, out);
    } else {
      out.add(currentPath);
    }
  }

  return out;
}

function diffPaths(base, target) {
  const missing = [];
  const extra = [];

  for (const key of base) {
    if (!target.has(key)) missing.push(key);
  }
  for (const key of target) {
    if (!base.has(key)) extra.push(key);
  }

  missing.sort();
  extra.sort();
  return { missing, extra };
}

function main() {
  const fileToPaths = new Map();

  for (const file of FILES) {
    const fullPath = path.join(MESSAGES_DIR, file);
    const objectNode = getObjectLiteralFromFile(fullPath);
    const leaves = collectLeafPaths(objectNode);
    fileToPaths.set(file, leaves);
  }

  const baseFile = 'en.ts';
  const basePaths = fileToPaths.get(baseFile);
  if (!basePaths) throw new Error('Missing base file en.ts in map');

  let hasError = false;

  for (const file of FILES) {
    if (file === baseFile) continue;

    const paths = fileToPaths.get(file);
    const { missing, extra } = diffPaths(basePaths, paths);

    if (!missing.length && !extra.length) {
      console.log(`✓ ${file}: key set matches ${baseFile}`);
      continue;
    }

    hasError = true;
    console.log(`✗ ${file}: key mismatch`);
    if (missing.length) {
      console.log(`  Missing (${missing.length}):`);
      for (const key of missing) console.log(`    - ${key}`);
    }
    if (extra.length) {
      console.log(`  Extra (${extra.length}):`);
      for (const key of extra) console.log(`    + ${key}`);
    }
  }

  if (hasError) {
    process.exitCode = 1;
  } else {
    console.log('\nAll locale files are key-aligned with en.ts');
  }
}

main();
