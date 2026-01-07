import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'bun:test';

import { bold } from './markdown';
import { write as safeWrite } from './safe';
import type { SchemaEmbedOptions } from './schema';
import {
  createJsonSchemaValidator,
  createYamlParserAdapter,
  ValidationError,
} from './validation';

const schemaOptions: SchemaEmbedOptions = {};
const validator = createJsonSchemaValidator(() => ({ valid: true }));
const yamlParser = createYamlParserAdapter((input: string) => input);

describe('subpath exports', () => {
  it('loads markdown helpers', () => {
    expect(bold('test')).toBe('**test**');
  });

  it('loads safe writer', () => {
    expect(safeWrite('safe').toString()).toBe('safe\n');
  });

  it('loads validation helpers', () => {
    expect(ValidationError).toBeDefined();
    expect(validator).toBeDefined();
    expect(yamlParser).toBeDefined();
    expect(schemaOptions).toBeDefined();
  });

  it('declares subpath exports in package.json', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      exports?: Record<string, unknown>;
    };
    expect(pkg.exports).toBeDefined();
    expect(pkg.exports?.['./markdown']).toBeDefined();
    expect(pkg.exports?.['./validation']).toBeDefined();
    expect(pkg.exports?.['./schema']).toBeDefined();
    expect(pkg.exports?.['./safe']).toBeDefined();
  });
});
