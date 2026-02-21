import path from 'node:path';

type Violation = {
  file: string;
  line: number;
  specifier: string;
};

const staticImportPattern = /\b(?:import|export)\b[\s\S]*?\bfrom\s*['"](\.[^'"\n]+)['"]/g;
const dynamicImportPattern = /\bimport\s*\(\s*['"](\.[^'"\n]+)['"]\s*\)/g;

const stripQueryAndHash = (specifier: string): string =>
  specifier.split(/[?#]/u)[0] ?? specifier;

const hasExplicitExtension = (specifier: string): boolean => {
  const clean = stripQueryAndHash(specifier);
  const lastSegment = clean.split('/').pop() ?? '';
  if (lastSegment.length === 0 || lastSegment === '.' || lastSegment === '..') {
    return false;
  }

  return /\.[a-z0-9]+$/iu.test(lastSegment);
};

const findLineNumber = (text: string, index: number): number => {
  if (index <= 0) {
    return 1;
  }

  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text[i] === '\n') {
      line += 1;
    }
  }
  return line;
};

const collectViolations = (file: string, text: string): Violation[] => {
  const violations: Violation[] = [];

  for (const pattern of [staticImportPattern, dynamicImportPattern]) {
    pattern.lastIndex = 0;

    for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
      const specifier = match[1];
      if (!specifier || hasExplicitExtension(specifier)) {
        continue;
      }

      const index = match.index;
      violations.push({
        file,
        line: findLineNumber(text, index),
        specifier,
      });
    }
  }

  return violations;
};

const run = async (): Promise<void> => {
  const glob = new Bun.Glob('dist/**/*.{js,d.ts}');
  const files = Array.from(glob.scanSync({ cwd: process.cwd(), absolute: false })).sort();

  if (files.length === 0) {
    console.error('No compiled dist files found. Run `bun run build` before this check.');
    process.exit(1);
  }

  const allViolations: Violation[] = [];

  for (const file of files) {
    const text = await Bun.file(file).text();
    allViolations.push(...collectViolations(file, text));
  }

  if (allViolations.length > 0) {
    console.error('Found extensionless relative imports in dist output:');
    for (const violation of allViolations) {
      const normalized = path.normalize(violation.file);
      console.error(`- ${normalized}:${violation.line} imports '${violation.specifier}'`);
    }
    process.exit(1);
  }

  console.log(
    `Checked ${files.length} dist files: all relative imports have explicit extensions.`,
  );
};

await run();
