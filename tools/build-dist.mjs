import { promises as fs } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const outRoot = path.join(root, 'dist');

await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

const sourceFiles = await listFiles(sourceRoot);
for (const file of sourceFiles) {
  const rel = slash(path.relative(sourceRoot, file));
  if (rel.endsWith('.d.ts')) continue;
  if (rel.endsWith('.ts')) {
    const outFile = path.join(outRoot, rel.replace(/\.ts$/, '.mjs'));
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    const source = await fs.readFile(file, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
        isolatedModules: true
      },
      fileName: file
    }).outputText;
    await fs.writeFile(outFile, rewriteImports(output, rel), 'utf8');
  }
}

for (const rel of await listRuntimeAssets()) {
  const src = path.join(sourceRoot, rel);
  const dest = path.join(outRoot, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

console.log(JSON.stringify({ ok: true, outDir: outRoot, files: (await listFiles(outRoot)).length }, null, 2));

async function listFiles(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

async function listRuntimeAssets() {
  const all = await listFiles(sourceRoot);
  return all
    .map((file) => slash(path.relative(sourceRoot, file)))
    .filter((rel) => /\.(astro|css)$/.test(rel));
}

function rewriteImports(code, rel) {
  return code.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (_match, start, specifier, end) => {
    return `${start}${rewriteSpecifier(rel, specifier)}${end}`;
  }).replace(/(import\s*\(\s*['"])(\.[^'"]+)(['"]\s*\))/g, (_match, start, specifier, end) => {
    return `${start}${rewriteSpecifier(rel, specifier)}${end}`;
  });
}

function rewriteSpecifier(rel, specifier) {
  if (/\.(mjs|js|json|astro|css)$/.test(specifier)) return specifier;
  const baseDir = path.posix.dirname(rel);
  const target = path.posix.normalize(path.posix.join(baseDir, specifier));
  if (existsSource(`${target}.ts`)) return `${specifier}.mjs`;
  if (existsSource(`${target}.astro`)) return `${specifier}.astro`;
  if (existsSource(`${target}.css`)) return `${specifier}.css`;
  if (existsSource(path.posix.join(target, 'index.ts'))) return `${specifier}/index.mjs`;
  return specifier;
}

function existsSource(rel) {
  return sourceFiles.some((file) => slash(path.relative(sourceRoot, file)) === rel);
}

function slash(value) {
  return value.replace(/\\/g, '/');
}
