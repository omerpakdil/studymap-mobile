const fs = require('fs');
const path = require('path');

const root = process.cwd();
const catalogPath = path.join(root, 'app/data/examCatalogByCountry.ts');
const configPath = path.join(root, 'app/data/examGoalConfigs.ts');

const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
const configSrc = fs.readFileSync(configPath, 'utf8');

const extractAll = (source, regex) => {
  const out = [];
  let m;
  while ((m = regex.exec(source)) !== null) out.push(m[1]);
  return out;
};

const catalogCodes = Array.from(new Set(extractAll(catalogSrc, /examCode:\s*'([^']+)'/g))).sort();
const configuredCaseCodes = Array.from(new Set(extractAll(configSrc, /case\s+'([^']+)'\s*:/g))).sort();
const allowedConfigOnlyCodes = new Set(['gmat']);

const missing = catalogCodes.filter((code) => !configuredCaseCodes.includes(code));
const extra = configuredCaseCodes.filter((code) => !catalogCodes.includes(code) && !allowedConfigOnlyCodes.has(code));

if (missing.length || extra.length) {
  console.error('Exam coverage validation failed.');
  if (missing.length) {
    console.error('\nMissing in examGoalConfigs switch cases:');
    missing.forEach((code) => console.error(`- ${code}`));
  }
  if (extra.length) {
    console.error('\nNot present in exam catalog:');
    extra.forEach((code) => console.error(`- ${code}`));
  }
  process.exit(1);
}

console.log(`Exam coverage OK. ${catalogCodes.length} catalog exams are explicitly configured.`);
