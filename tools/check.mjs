import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'README.md',
  'README.zh-CN.md',
  'LICENSE',
  '.gitignore',
  '.env.example',
  'astro.config.example.mjs',
  'package.json',
  'tsconfig.json',
  'index.d.ts',
  'client.d.ts',
  'server.d.ts',
  'content.d.ts',
  'types.d.ts',
  'components/DdysShell.d.ts',
  'components/DdysCard.d.ts',
  'components/DdysGrid.d.ts',
  'components/DdysMovieDetail.d.ts',
  'components/DdysSources.d.ts',
  'components/DdysView.d.ts',
  'components/DdysSearch.d.ts',
  'components/DdysRequestForm.d.ts',
  'components/DdysDiagnostics.d.ts',
  'src/index.ts',
  'src/integration.ts',
  'src/runtime/config.ts',
  'src/runtime/middleware.ts',
  'src/runtime/types/ddys.ts',
  'src/runtime/types/astro.d.ts',
  'src/runtime/types/virtual.d.ts',
  'src/runtime/utils/security.ts',
  'src/runtime/utils/display.ts',
  'src/runtime/client/client.ts',
  'src/runtime/client/error.ts',
  'src/runtime/client/index.ts',
  'src/runtime/client/proxy-client.ts',
  'src/runtime/server/index.ts',
  'src/runtime/server/cache.ts',
  'src/runtime/server/client.ts',
  'src/runtime/server/config.ts',
  'src/runtime/server/request-service.ts',
  'src/runtime/server/response.ts',
  'src/runtime/server/seo.ts',
  'src/runtime/endpoints/assets.ts',
  'src/runtime/endpoints/proxy.ts',
  'src/runtime/endpoints/request.ts',
  'src/runtime/endpoints/diagnostics.ts',
  'src/runtime/endpoints/revalidate.ts',
  'src/runtime/endpoints/sitemap.ts',
  'src/runtime/endpoints/robots.ts',
  'src/runtime/endpoints/manifest.ts',
  'src/runtime/content/index.ts',
  'src/runtime/components/DdysShell.astro',
  'src/runtime/components/DdysShell.astro.d.ts',
  'src/runtime/components/DdysCard.astro',
  'src/runtime/components/DdysCard.astro.d.ts',
  'src/runtime/components/DdysGrid.astro',
  'src/runtime/components/DdysGrid.astro.d.ts',
  'src/runtime/components/DdysMovieDetail.astro',
  'src/runtime/components/DdysMovieDetail.astro.d.ts',
  'src/runtime/components/DdysSources.astro',
  'src/runtime/components/DdysSources.astro.d.ts',
  'src/runtime/components/DdysView.astro',
  'src/runtime/components/DdysView.astro.d.ts',
  'src/runtime/components/DdysSearch.astro',
  'src/runtime/components/DdysSearch.astro.d.ts',
  'src/runtime/components/DdysRequestForm.astro',
  'src/runtime/components/DdysRequestForm.astro.d.ts',
  'src/runtime/components/DdysDiagnostics.astro',
  'src/runtime/components/DdysDiagnostics.astro.d.ts',
  'src/runtime/styles/ddys.css',
  'public/images/icon-16.png',
  'public/images/icon-32.png',
  'public/images/icon-192.png',
  'public/images/icon-512.png',
  'public/images/logo.png',
  'tests/structure.test.mjs',
  'tools/build-package.ps1',
  'tools/build-dist.mjs',
  'tools/check.mjs'
];

const pageFiles = [
  'src/runtime/pages/index.astro',
  'src/runtime/pages/latest.astro',
  'src/runtime/pages/hot.astro',
  'src/runtime/pages/movies.astro',
  'src/runtime/pages/search.astro',
  'src/runtime/pages/calendar.astro',
  'src/runtime/pages/movie/[slug]/index.astro',
  'src/runtime/pages/movie/[slug]/sources.astro',
  'src/runtime/pages/collections.astro',
  'src/runtime/pages/shares.astro',
  'src/runtime/pages/types.astro',
  'src/runtime/pages/genres.astro',
  'src/runtime/pages/regions.astro',
  'src/runtime/pages/request.astro',
  'src/runtime/pages/diagnostics.astro'
];

const exampleFiles = [
  'examples/astro-app/astro.config.mjs',
  'examples/astro-app/src/pages/custom.astro',
  'examples/astro-app/src/content/config.ts'
];

const clientMethods = [
  'movies', 'latest', 'hot', 'search', 'suggest', 'calendar',
  'movie', 'sources', 'related', 'comments',
  'collections', 'collection', 'shares', 'share',
  'requests', 'activities', 'user', 'types', 'genres', 'regions',
  'me', 'createRequest', 'createComment', 'deleteComment',
  'reportInvalidResource', 'follow', 'unfollow'
];

for (const file of [...requiredFiles, ...pageFiles, ...exampleFiles]) await mustExist(file);
await checkEncoding();
await checkPackage();
await checkIntegration();
await checkClient();
await checkServer();
await checkEndpoints();
await checkComponentsAndPages();
await checkExamples();
await checkAssets();
await checkDocs();
await checkBuildScripts();
await checkForbiddenFiles();
await checkForbiddenText();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, files: (await listFiles(root)).length, pages: pageFiles.length, clientMethods: clientMethods.length }, null, 2));

async function mustExist(rel) {
  try { await fs.stat(path.join(root, rel)); } catch { failures.push(`Missing required file: ${rel}`); }
}

async function checkEncoding() {
  for (const full of await listFiles(root)) {
    const rel = slash(path.relative(root, full));
    if (!isTextFile(rel)) continue;
    const buffer = await fs.readFile(full);
    assert(!(buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf), `${rel} must not contain a UTF-8 BOM.`);
    const text = buffer.toString('utf8');
    assert(!text.includes('\uFFFD'), `${rel} contains Unicode replacement characters.`);
  }
}

async function checkPackage() {
  const pkg = JSON.parse(await read('package.json'));
  assert(pkg.name === 'ddys-astro', 'package name mismatch.');
  assert(pkg.type === 'module', 'package must be ESM.');
  assert(pkg.publishConfig?.access === 'public', 'package must be public publishable.');
  assert(pkg.types === './index.d.ts' && pkg.exports?.['.']?.types === './index.d.ts' && pkg.exports?.['.']?.import === './dist/index.mjs', 'root export must use dist and top-level types.');
  for (const entry of ['./client', './server', './content', './types']) assert(pkg.exports?.[entry]?.import?.startsWith('./dist/'), `package export ${entry} must use dist.`);
  assert(pkg.exports?.['./client']?.types === './client.d.ts' && pkg.exports?.['./server']?.types === './server.d.ts' && pkg.exports?.['./content']?.types === './content.d.ts', 'package subpath exports must use top-level declarations.');
  assert(pkg.exports?.['./components/DdysView']?.types === './components/DdysView.d.ts', 'component typed export mismatch.');
  assert(pkg.exports?.['./components/*']?.types === './components/*.d.ts' && pkg.exports?.['./components/*']?.import === './dist/runtime/components/*.astro', 'component export pattern mismatch.');
  assert(pkg.exports?.['./styles.css'] === './dist/runtime/styles/ddys.css', 'styles export mismatch.');
  assert(pkg.files?.includes('dist') && pkg.files?.includes('index.d.ts') && pkg.files?.includes('client.d.ts') && pkg.files?.includes('server.d.ts') && pkg.files?.includes('content.d.ts') && pkg.files?.includes('types.d.ts') && pkg.files?.includes('src') && pkg.files?.includes('components') && pkg.files?.includes('examples') && pkg.files?.includes('public'), 'package files must include dist, top-level declarations, src, component declarations, examples, and public.');
  assert(pkg.peerDependencies?.astro, 'package must declare Astro peer dependency.');
  assert(pkg.scripts?.build === 'node tools/build-dist.mjs' && pkg.scripts?.prepack === 'node tools/build-dist.mjs', 'package must build before pack.');
}

async function checkIntegration() {
  const text = await read('src/integration.ts');
  for (const fragment of ['AstroIntegration', 'astro:config:setup', 'astro:config:done', 'config.output', 'serverOutput', 'needsServerOutput', 'injectRoute', 'injectScript', 'addMiddleware', 'createCodegenDir', 'injectTypes', 'virtual:ddys-astro/config', '/sitemap.xml', '/manifest.webmanifest', 'runtime/pages/movie/[slug]/sources.astro']) {
    assert(text.includes(fragment), `integration missing ${fragment}.`);
  }
  assert(text.includes('runtime pages and API endpoints are disabled') && text.includes('Static builds keep components'), 'integration must guard static output and explain server-only features.');
}

async function checkClient() {
  const client = await read('src/runtime/client/client.ts');
  for (const method of clientMethods) assert(client.includes(`${method}(`), `DdysClient missing ${method}().`);
  for (const fragment of ['sendWithRetry', "method !== 'GET'", 'Authorization', 'Bearer', 'resolveProxyPath', 'allowRoutes', 'noCache']) {
    assert(client.includes(fragment), `DdysClient missing ${fragment}.`);
  }
  const proxy = await read('src/runtime/client/proxy-client.ts');
  for (const fragment of ['DdysProxyClient', '/proxy', 'createRequest', 'routePrefix']) assert(proxy.includes(fragment), `proxy client missing ${fragment}.`);
  const security = await read('src/runtime/utils/security.ts');
  for (const fragment of ['normalizeBaseUrl', 'buildQuery', 'safeMediaUrl', 'isAllowedResourceUrl', 'formDataToObject', 'maxPerPage']) {
    assert(security.includes(fragment), `security utils missing ${fragment}.`);
  }
}

async function checkServer() {
  const request = await read('src/runtime/server/request-service.ts');
  for (const fragment of ['createRequestFormToken', 'verifyRequestFormToken', 'subtle', 'enforceRateLimit', 'normalizeRequestInput', 'honeypot', 'DDYS request form is disabled']) {
    assert(request.includes(fragment), `request service missing ${fragment}.`);
  }
  assert(request.includes('!config.requestForm.enabled') && request.includes("return '';"), 'request token helper must be safe when request form is disabled.');
  const cache = await read('src/runtime/server/cache.ts');
  assert(cache.includes('cachedDdys') && cache.includes('revalidateDdysCache') && cache.includes('tagsForRoute'), 'cache helpers missing.');
  const seo = await read('src/runtime/server/seo.ts');
  for (const fragment of ['createDdysSitemap', 'createDdysRobotsText', 'createDdysManifest', 'createDdysMovieJsonLd', 'createDdysMovieSeo']) assert(seo.includes(fragment), `SEO helper missing ${fragment}.`);
  const middleware = await read('src/runtime/middleware.ts');
  assert(middleware.includes('defineMiddleware') && middleware.includes('context.locals.ddys'), 'middleware must inject Astro locals.');
}

async function checkEndpoints() {
  for (const file of ['proxy.ts', 'request.ts', 'diagnostics.ts', 'revalidate.ts', 'sitemap.ts']) {
    const text = await read(`src/runtime/endpoints/${file}`);
    assert(text.includes('prerender = false'), `${file} must be on-demand rendered.`);
  }
  for (const file of ['robots.ts', 'manifest.ts', 'assets.ts']) {
    const text = await read(`src/runtime/endpoints/${file}`);
    assert(text.includes('prerender = true'), `${file} must be static-build compatible.`);
  }
  assert((await read('src/runtime/endpoints/assets.ts')).includes('getStaticPaths'), 'asset endpoint must statically enumerate packaged icons.');
  assert((await read('src/runtime/endpoints/proxy.ts')).includes('cachedDdys') && (await read('src/runtime/endpoints/proxy.ts')).includes('allowRoutes'), 'proxy endpoint must cache and validate.');
  assert((await read('src/runtime/endpoints/revalidate.ts')).includes('revalidateToken'), 'revalidate endpoint must validate token.');
}

async function checkComponentsAndPages() {
  for (const component of ['DdysShell', 'DdysCard', 'DdysGrid', 'DdysMovieDetail', 'DdysSources', 'DdysView', 'DdysSearch', 'DdysRequestForm', 'DdysDiagnostics']) {
    const text = await read(`src/runtime/components/${component}.astro`);
    assert(text.includes('---') && (text.includes('ddys-astro') || text.includes('DDYS')), `${component} must be an Astro component.`);
  }
  for (const page of pageFiles) {
    const text = await read(page);
    assert(text.includes('DdysShell') || text.includes('DDYS'), `${page} must render DDYS shell.`);
  }
  const css = await read('src/runtime/styles/ddys.css');
  assert(css.includes('ddys-astro-grid') && css.includes('ddys-astro-request-form') && css.includes('@media') && css.includes('prefers-color-scheme'), 'CSS must include layout, request form, responsive, and dark-mode styles.');
  const shell = await read('src/runtime/components/DdysShell.astro');
  assert(shell.includes('og:title') && shell.includes('twitter:card') && shell.includes('application/ld+json'), 'DdysShell must render SEO head metadata.');
  const moviePage = await read('src/runtime/pages/movie/[slug]/index.astro');
  assert(moviePage.includes('createDdysMovieSeo') && moviePage.includes('jsonLd') && moviePage.includes('DdysShell'), 'movie page must render SEO metadata in the document head.');
}

async function checkExamples() {
  for (const file of exampleFiles) {
    const text = await read(file);
    assert(text.includes('ddys') || text.includes('Ddys') || text.includes('DDYS'), `${file} must use DDYS integration.`);
  }
  assert((await read('examples/astro-app/src/content/config.ts')).includes('createDdysContentLoader') && (await read('examples/astro-app/src/content/config.ts')).includes('params'), 'content loader example missing params.');
}

async function checkAssets() {
  const expected = {
    'public/images/icon-16.png': [16, 16],
    'public/images/icon-32.png': [32, 32],
    'public/images/icon-192.png': [192, 192],
    'public/images/icon-512.png': [512, 512],
    'public/images/logo.png': [512, 512]
  };
  for (const [rel, size] of Object.entries(expected)) {
    const actual = await pngSize(rel);
    assert(actual[0] === size[0] && actual[1] === size[1], `${rel} must be ${size[0]}x${size[1]}, got ${actual[0]}x${actual[1]}.`);
  }
}

async function checkDocs() {
  const en = await read('README.md');
  const zh = await read('README.zh-CN.md');
  assert(en.includes('[中文](README.zh-CN.md)') && zh.includes('[English](README.md)'), 'READMEs must link to each other.');
  for (const fragment of ['ddys-astro', 'astro:config:setup', 'output: \'server\'', 'Astro.locals.ddys', 'DdysProxyClient', 'Content Loader', 'DdysRequestForm', 'createDdysContentLoader', '/api/ddys/proxy', 'DDYS_API_KEY']) {
    assert(en.includes(fragment) && zh.includes(fragment), `READMEs missing ${fragment}.`);
  }
  assert(en.includes('Static Astro projects') && zh.includes('静态 Astro 项目'), 'READMEs must document static output behavior.');
}

async function checkBuildScripts() {
  const packageScript = await read('tools/build-package.ps1');
  assert(packageScript.includes('ddys-astro-v{0}.zip') && packageScript.includes('StartsWith($resolvedRoot') && packageScript.includes('ZipFileExtensions'), 'build-package.ps1 must safely create release zip.');
  const build = await read('tools/build-dist.mjs');
  assert(build.includes('transpileModule') && build.includes('rewriteImports') && build.includes('.mjs') && build.includes('.astro') && build.includes('.d.ts'), 'build-dist.mjs must create ESM dist output and copy Astro files.');
}

async function checkForbiddenFiles() {
  for (const full of await listFiles(root)) {
    const rel = slash(path.relative(root, full));
    assert(rel === '.env.example' || !/(^|\/)(\.env|\.env\..*|node_modules|\.astro|\.vercel|\.netlify|coverage|dist)(\/|$)/.test(rel), `Forbidden generated or sensitive path committed: ${rel}`);
    assert(rel !== 'pnpm-lock.yaml', 'pnpm-lock.yaml is a local verification artifact for this source package.');
    assert(!/\.(log|bak|tmp|cache|tgz)$/i.test(rel), `Forbidden generated file committed: ${rel}`);
  }
}

async function checkForbiddenText() {
  const patterns = ['ghp_', 'github_pat_', 'npm_', '\uFFFD', '????', '娑?', '闂?', '閺?', '閸?', '缁?'];
  for (const full of await listFiles(root)) {
    const rel = slash(path.relative(root, full));
    if (!isTextFile(rel) || rel === 'tools/check.mjs') continue;
    const text = await read(rel);
    for (const pattern of patterns) assert(!text.includes(pattern), `${rel} contains forbidden text pattern ${pattern}.`);
  }
}

async function read(rel) {
  return fs.readFile(path.join(root, rel), 'utf8');
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (['.git', 'dist', 'node_modules', '.astro', '.vercel', '.netlify', 'coverage'].includes(entry.name) || entry.name === 'pnpm-lock.yaml') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(full));
    else out.push(full);
  }
  return out;
}

async function pngSize(rel) {
  const buffer = await fs.readFile(path.join(root, rel));
  assert(buffer.readUInt32BE(0) === 0x89504e47, `${rel} is not a PNG.`);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function isTextFile(rel) {
  return /\.(ts|astro|js|mjs|json|css|md|txt|ps1)$/i.test(rel) || rel === '.gitignore' || rel === 'LICENSE' || rel === '.env.example';
}

function slash(value) {
  return value.replace(/\\/g, '/');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}
