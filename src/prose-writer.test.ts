import { describe, expect, it } from 'bun:test';

import type { ListBuilder } from './prose-writer';
import {
  bold,
  code,
  image,
  inline,
  italic,
  link,
  ProseWriter,
  strike,
  write,
} from './prose-writer';

describe('ProseWriter', () => {
  describe('write', () => {
    it('creates a new ProseWriter with initial content and a newline', () => {
      const result = write('hello').toString();
      expect(result).toBe('hello\n');
    });

    it('joins multiple strings with a space', () => {
      const result = write('hello', 'world').toString();
      expect(result).toBe('hello world\n');
    });

    it('chains multiple write calls with newlines', () => {
      const result = write('first').write('second').toString();
      expect(result).toBe('first\n\nsecond\n');
    });

    it('can be converted to string using String()', () => {
      const prose = write('hello', 'world');
      expect(String(prose)).toBe('hello world\n');
    });

    it('works with template literals', () => {
      const prose = write('hello');
      expect(`${String(prose)}`).toBe('hello\n');
    });

    it('supports standalone utilities in write', () => {
      const result = write('Use', code('func'), 'with', bold('caution')).toString();
      expect(result).toBe('Use `func` with **caution**\n');
    });

    it('does not append a newline if the writer is empty and no arguments are provided', () => {
      const result = write().toString();
      expect(result).toBe('');
    });

    it('does not append a newline if the writer is empty and an empty string is provided', () => {
      const result = write('').toString();
      expect(result).toBe('');
    });

    it('appends a newline if the writer is not empty even if no arguments are provided', () => {
      const result = write('hello').write().toString();
      expect(result).toBe('hello\n\n\n');
    });

    it('supports inline as an alias for code', () => {
      const result = write('Some', inline('code')).toString();
      expect(result).toBe('Some `code`\n');
    });

    it('supports .with on the initial write function', () => {
      const result = write
        .with((w) => {
          w.write('Hello', w.bold('World'));
        })
        .toString();
      expect(result).toBe('Hello **World**\n');
    });
  });

  describe('standalone utilities', () => {
    it('bold() returns bolded string', () => {
      expect(bold('test')).toBe('**test**');
    });

    it('italic() returns italicized string', () => {
      expect(italic('test')).toBe('*test*');
    });

    it('code() returns backticked string', () => {
      expect(code('test')).toBe('`test`');
    });

    it('inline() returns backticked string', () => {
      expect(inline('test')).toBe('`test`');
    });

    it('strike() returns strikethrough string', () => {
      expect(strike('test')).toBe('~~test~~');
    });

    it('can be used as a chainable method', () => {
      expect(write('old').strike('new').toString()).toBe('old\n\n~~new~~\n');
    });

    it('link() returns markdown link string', () => {
      expect(link('A', 'B')).toBe('[A](B)');
    });

    it('image() returns markdown image string', () => {
      expect(image('A', 'B')).toBe('![A](B)');
    });

    it('can be used as a chainable method', () => {
      expect(write('').image('alt', 'url').toString()).toBe('![alt](url)\n');
    });

    it('trims ProseWriter instances in inline utilities', () => {
      const nested = write('hello');
      expect(bold(nested)).toBe('**hello**');
      expect(italic(nested)).toBe('*hello*');
      expect(code(nested)).toBe('`hello`');
      expect(strike(nested)).toBe('~~hello~~');
      expect(link(nested, 'url')).toBe('[hello](url)');
      expect(image(nested, 'url')).toBe('![hello](url)');
    });
  });

  describe('nextLine', () => {
    it('prevents a paragraph break between write calls', () => {
      const result = write('line1').nextLine().write('line2').toString();
      expect(result).toBe('line1\nline2\n');
    });

    it('can be chained multiple times', () => {
      const result = write('a').nextLine().write('b').nextLine().write('c').toString();
      expect(result).toBe('a\nb\nc\n');
    });
  });

  describe('unorderedList', () => {
    it('creates an unordered list', () => {
      const result = write('intro').unorderedList('item1', 'item2', 'item3').toString();
      expect(result).toBe('intro\n\n- item1\n- item2\n- item3\n\n');
    });

    it('is aliased by list()', () => {
      const result = write('intro').list('item1', 'item2').toString();
      expect(result).toBe('intro\n\n- item1\n- item2\n\n');
    });

    it('supports a builder function', () => {
      const result = write('Plan')
        .unorderedList((l) => {
          l.item('Step 1');
          l.unorderedList((sl) => {
            sl.item('Sub 1');
          });
        })
        .toString();
      expect(result).toBe('Plan\n\n- Step 1\n  - Sub 1\n\n');
    });
  });

  describe('list', () => {
    it('creates an unordered list', () => {
      const result = write('intro').list('item1', 'item2', 'item3').toString();
      expect(result).toBe('intro\n\n- item1\n- item2\n- item3\n\n');
    });

    it('is chainable', () => {
      const result = write('start').list('a', 'b').write('end').toString();
      expect(result).toBe('start\n\n- a\n- b\n\nend\n');
    });

    it('supports a builder function', () => {
      const result = write('Plan')
        .list((l) => {
          l.item('Step 1');
          l.list((sl) => {
            sl.item('Sub 1');
            sl.item('Sub 2');
          });
          l.item('Step 2');
        })
        .toString();
      expect(result).toBe('Plan\n\n- Step 1\n  - Sub 1\n  - Sub 2\n- Step 2\n\n');
    });
  });

  describe('orderedList', () => {
    it('creates an ordered list', () => {
      const result = write('intro').orderedList('first', 'second', 'third').toString();
      expect(result).toBe('intro\n\n1. first\n2. second\n3. third\n\n');
    });

    it('handles single item', () => {
      const result = write('intro').orderedList('only item').toString();
      expect(result).toBe('intro\n\n1. only item\n\n');
    });

    it('is chainable', () => {
      const result = write('start').orderedList('a', 'b').write('end').toString();
      expect(result).toBe('start\n\n1. a\n2. b\n\nend\n');
    });

    it('supports a builder function', () => {
      const result = write('Steps')
        .orderedList((l) => {
          l.item('First');
          l.orderedList((sl) => {
            sl.item('Sub first');
          });
          l.item('Second');
        })
        .toString();
      expect(result).toBe('Steps\n\n1. First\n  1. Sub first\n2. Second\n\n');
    });
  });

  describe('tasks', () => {
    it('creates a task list with checkboxes using a builder', () => {
      const result = write('Todo:')
        .tasks((l) => {
          l.task(true, 'Done task');
          l.task(false, 'Pending task');
        })
        .toString();
      expect(result).toBe('Todo:\n\n- [x] Done task\n- [ ] Pending task\n\n');
    });

    it('supports todo() and done() in builder', () => {
      const result = write('')
        .tasks((l) => {
          l.done('Task 1');
          l.todo('Task 2');
        })
        .toString();
      expect(result).toBe('- [x] Task 1\n- [ ] Task 2\n\n');
    });

    it('supports comment() in builder', () => {
      const result = write('')
        .tasks((l) => {
          l.item('Task 1');
          l.comment('Hidden note');
        })
        .toString();
      expect(result).toBe('- Task 1\n  <!-- Hidden note -->\n\n');
    });

    it('supports a list of items with mixed types', () => {
      const result = write('Todo:')
        .tasks('Default todo', ['Explicit done', true], ['Explicit todo', false])
        .toString();
      expect(result).toBe(
        'Todo:\n\n- [ ] Default todo\n- [x] Explicit done\n- [ ] Explicit todo\n\n',
      );
    });

    it('is chainable', () => {
      const result = write('Todo:')
        .tasks((l) => {
          l.task(true, 'Done');
        })
        .write('End')
        .toString();
      expect(result).toBe('Todo:\n\n- [x] Done\n\nEnd\n');
    });

    it('can be started from write.tasks', () => {
      const result = write
        .tasks((l: ListBuilder) => {
          l.task(false, 'Task');
        })
        .toString();
      expect(result).toBe('- [ ] Task\n\n');
    });

    it('can be started from write.tasks with items', () => {
      const result = write.tasks('A', ['B', true]).toString();
      expect(result).toBe('- [ ] A\n- [x] B\n\n');
    });

    it('supports complex nesting in list builder', () => {
      const result = write
        .list((l) => {
          l.item('Parent');
          l.unorderedList((sl) => sl.item('Unordered'));
          l.orderedList((sl) => sl.item('Ordered'));
          l.list('Another', 'List');
        })
        .toString();
      expect(result).toContain('- Parent');
      expect(result).toContain('  - Unordered');
      expect(result).toContain('  1. Ordered');
      expect(result).toContain('  - Another');
    });

    it('can be started from write.unorderedList', () => {
      const result = write.unorderedList('A', 'B').toString();
      expect(result).toBe('- A\n- B\n\n');
    });

    it('can be started from write.unorderedList with builder', () => {
      const result = write.unorderedList((l) => l.item('A')).toString();
      expect(result).toBe('- A\n\n');
    });

    it('can be started from write.orderedList', () => {
      const result = write.orderedList('A', 'B').toString();
      expect(result).toBe('1. A\n2. B\n\n');
    });

    it('can be started from write.orderedList with builder', () => {
      const result = write.orderedList((l) => l.item('A')).toString();
      expect(result).toBe('1. A\n\n');
    });

    it('can be started from write.list', () => {
      const result = write.list('A', 'B').toString();
      expect(result).toBe('- A\n- B\n\n');
    });

    it('can be started from write.list with builder', () => {
      const result = write.list((l) => l.item('A')).toString();
      expect(result).toBe('- A\n\n');
    });
  });

  describe('heading', () => {
    it('creates h1 heading', () => {
      const result = write('intro').heading(1, 'Title').write('content').toString();
      expect(result).toBe('intro\n\n# Title\n\ncontent\n');
    });

    it('joins multiple strings with a space in heading', () => {
      const result = write('').heading(1, 'Hello', 'World').toString();
      expect(result).toBe('# Hello World\n\n');
    });

    it('creates h2 heading', () => {
      const result = write('').heading(2, 'Section').toString();
      expect(result).toBe('## Section\n\n');
    });

    it('creates h3 heading', () => {
      const result = write('').heading(3, 'Subsection').toString();
      expect(result).toBe('### Subsection\n\n');
    });

    it('creates h4 heading', () => {
      const result = write('').heading(4, 'Deep').toString();
      expect(result).toBe('#### Deep\n\n');
    });

    it('creates h5 heading', () => {
      const result = write('').heading(5, 'Deeper').toString();
      expect(result).toBe('##### Deeper\n\n');
    });

    it('creates h6 heading', () => {
      const result = write('').heading(6, 'Deepest').toString();
      expect(result).toBe('###### Deepest\n\n');
    });

    it('is chainable', () => {
      const result = write('start').heading(1, 'Title').heading(2, 'Section').toString();
      expect(result).toBe('start\n\n# Title\n\n## Section\n\n');
    });
  });

  describe('blockquote', () => {
    it('creates a blockquote with single line', () => {
      const result = write('intro').blockquote('quoted text').toString();
      expect(result).toBe('intro\n\n> quoted text\n\n');
    });

    it('creates a blockquote with multiple lines', () => {
      const result = write('intro').blockquote('line 1', 'line 2', 'line 3').toString();
      expect(result).toBe('intro\n\n> line 1\n>\n> line 2\n>\n> line 3\n\n');
    });

    it('is chainable', () => {
      const result = write('before').blockquote('quote').write('after').toString();
      expect(result).toBe('before\n\n> quote\n\nafter\n');
    });
  });

  describe('codeblock', () => {
    it('creates a fenced code block', () => {
      const result = write('intro').codeblock('typescript', 'const x = 1;').toString();
      expect(result).toBe('intro\n\n```typescript\nconst x = 1;\n```\n\n');
    });

    it('handles multiline code', () => {
      const code = 'function hello() {\n  return "world";\n}';
      const result = write('').codeblock('javascript', code).toString();
      expect(result).toBe(
        '```javascript\nfunction hello() {\n  return "world";\n}\n```\n\n',
      );
    });

    it('works with various languages', () => {
      const result = write('').codeblock('python', 'print("hello")').toString();
      expect(result).toBe('```python\nprint("hello")\n```\n\n');
    });

    it('is chainable', () => {
      const result = write('start').codeblock('js', 'code').write('end').toString();
      expect(result).toBe('start\n\n```js\ncode\n```\n\nend\n');
    });

    it('supports a builder function', () => {
      const result = write('Start')
        .codeblock('bash', (w) => {
          w.write('npm install');
          w.write('npm run build');
        })
        .toString();
      expect(result).toBe('Start\n\n```bash\nnpm install\n\nnpm run build\n```\n\n');
    });
  });

  describe('separator', () => {
    it('appends a horizontal rule', () => {
      const result = write('above').separator.write('below').toString();
      expect(result).toBe('above\n\n---\n\nbelow\n');
    });

    it('can be used multiple times', () => {
      const result = write('a').separator.write('b').separator.write('c').toString();
      expect(result).toBe('a\n\n---\n\nb\n\n---\n\nc\n');
    });
  });

  describe('json', () => {
    it('creates a JSON code block from object', () => {
      const result = write('data:').json({ key: 'value' }).toString();
      expect(result).toBe('data:\n\n```json\n{\n  "key": "value"\n}\n```\n\n');
    });

    it('creates a JSON code block from array', () => {
      const result = write('array:').json([1, 2, 3]).toString();
      expect(result).toBe('array:\n\n```json\n[\n  1,\n  2,\n  3\n]\n```\n\n');
    });

    it('handles string input directly', () => {
      const result = write('').json('{"raw": "json"}').toString();
      expect(result).toBe('```json\n{"raw": "json"}\n```\n\n');
    });

    it('handles nested objects', () => {
      const data = { outer: { inner: { deep: 'value' } } };
      const result = write('').json(data).toString();
      expect(result).toContain('"outer"');
      expect(result).toContain('"inner"');
      expect(result).toContain('"deep"');
    });

    it('is chainable', () => {
      const result = write('before').json({ a: 1 }).write('after').toString();
      expect(result).toBe('before\n\n```json\n{\n  "a": 1\n}\n```\n\nafter\n');
    });
  });

  describe('complex chains', () => {
    it('builds a complete document', () => {
      const result = write('Introduction to the API')
        .heading(1, 'API Documentation')
        .write('This document describes the API.')
        .heading(2, 'Features')
        .list('Fast', 'Reliable', 'Easy to use')
        .heading(2, 'Getting Started')
        .orderedList('Install the package', 'Import the function', 'Start writing')
        .heading(2, 'Example')
        .codeblock('typescript', "import { write } from 'prose-writer';")
        .heading(2, 'Notes')
        .blockquote('This is important', 'Do not forget this')
        .separator.write('The End')
        .toString();

      expect(result).toContain('# API Documentation');
      expect(result).toContain('## Features');
      expect(result).toContain('- Fast');
      expect(result).toContain('1. Install the package');
      expect(result).toContain('```typescript');
      expect(result).toContain('> This is important');
      expect(result).toContain('---');
      expect(result).toContain('The End');
    });

    it('handles empty initial content', () => {
      const result = write('').heading(1, 'Title').write('content').toString();
      expect(result).toBe('# Title\n\ncontent\n');
    });
  });

  describe('append', () => {
    it('appends content from another ProseWriter', () => {
      const persona = write('You are an expert.');
      const result = write('System:').append(persona).toString();
      expect(result).toBe('System:\n\nYou are an expert.\n');
    });

    it('appends complex ProseWriter content', () => {
      const instructions = write('Guidelines:').list('Be concise', 'Be accurate');
      const result = write('Intro').append(instructions).toString();
      expect(result).toBe('Intro\n\nGuidelines:\n\n- Be concise\n- Be accurate\n\n');
    });

    it('is chainable', () => {
      const part1 = write('Part 1');
      const part2 = write('Part 2');
      const part3 = write('Part 3');
      const result = write('Start:').append(part1).append(part2).append(part3).toString();
      expect(result).toBe('Start:\n\nPart 1\n\nPart 2\n\nPart 3\n');
    });

    it('works with empty ProseWriter', () => {
      const empty = write('');
      const result = write('Content').append(empty).write('More').toString();
      expect(result).toBe('Content\n\nMore\n');
    });

    it('preserves formatting from appended writer', () => {
      const formatted = write('').heading(2, 'Section').list('Item 1', 'Item 2');
      const result = write('Header').append(formatted).toString();
      expect(result).toContain('## Section');
      expect(result).toContain('- Item 1');
    });
  });

  describe('when', () => {
    it('executes builder when condition is true', () => {
      const result = write('Start')
        .when(true, (w) => w.write(' - added'))
        .toString();
      expect(result).toBe('Start\n\n - added\n');
    });

    it('skips builder when condition is false', () => {
      const result = write('Start')
        .when(false, (w) => w.write(' - not added'))
        .toString();
      expect(result).toBe('Start\n');
    });

    it('works with truthy values', () => {
      const result = write('Start')
        .when('truthy string', (w) => w.write(' - added'))
        .toString();
      expect(result).toBe('Start\n\n - added\n');
    });

    it('works with falsy values', () => {
      const result = write('Start')
        .when(0, (w) => w.write(' - not added'))
        .when('', (w) => w.write(' - also not added'))
        .when(null, (w) => w.write(' - still not added'))
        .when(undefined, (w) => w.write(' - definitely not added'))
        .toString();
      expect(result).toBe('Start\n');
    });

    it('is chainable regardless of condition', () => {
      const result = write('A')
        .when(true, (w) => w.write('B'))
        .when(false, (w) => w.write('X'))
        .when(true, (w) => w.write('C'))
        .toString();
      expect(result).toBe('A\n\nB\n\nC\n');
    });
  });

  describe('with', () => {
    it('executes the builder function', () => {
      const result = write('Start')
        .with((w) => w.write('middle'))
        .write('End')
        .toString();
      expect(result).toBe('Start\n\nmiddle\n\nEnd\n');
    });

    it('provides inline formatters without imports', () => {
      const result = write('Start')
        .with((w) => {
          w.write('This is', w.bold('important'), 'and', w.italic('emphasized'));
        })
        .toString();
      expect(result).toBe('Start\n\nThis is **important** and *emphasized*\n');
    });

    it('is chainable', () => {
      const result = write('A')
        .with((w) => w.write('B'))
        .with((w) => w.write('C'))
        .toString();
      expect(result).toBe('A\n\nB\n\nC\n');
    });
  });

  describe('tag', () => {
    it('wraps string content in XML tags', () => {
      const result = write('Analyze:').tag('document', 'This is the content.').toString();
      expect(result).toBe('Analyze:\n\n<document>\nThis is the content.\n</document>\n');
    });

    it('wraps ProseWriter content in XML tags', () => {
      const content = write('Line 1').write('Line 2');
      const result = write('').tag('content', content).toString();
      expect(result).toBe('<content>\nLine 1\n\nLine 2\n</content>\n');
    });

    it('is chainable', () => {
      const result = write('Request:')
        .tag('input', 'User query')
        .tag('context', 'Background info')
        .toString();
      expect(result).toContain('<input>');
      expect(result).toContain('</input>');
      expect(result).toContain('<context>');
      expect(result).toContain('</context>');
    });

    it('handles nested tags via ProseWriter', () => {
      const inner = write('').tag('inner', 'nested content');
      const result = write('').tag('outer', inner).toString();
      expect(result).toContain('<outer>');
      expect(result).toContain('<inner>');
      expect(result).toContain('nested content');
      expect(result).toContain('</inner>');
      expect(result).toContain('</outer>');
    });

    it('supports a builder function', () => {
      const result = write('')
        .tag('system', (w) => {
          w.write('You are an assistant.');
          w.write('Be helpful.');
        })
        .toString();
      expect(result).toBe('<system>\nYou are an assistant.\n\nBe helpful.\n</system>\n');
    });
  });

  describe('code', () => {
    it('wraps content in backticks', () => {
      const result = write('Use the', code('calculateTotal'), 'function.').toString();
      expect(result).toBe('Use the `calculateTotal` function.\n');
    });

    it('is chainable as method', () => {
      const result = write('Call').code('foo').write('then').code('bar').toString();
      expect(result).toBe('Call\n\n`foo`\n\nthen\n\n`bar`\n');
    });
  });

  describe('fill', () => {
    it('replaces single variable', () => {
      const template = write('Hello, {{name}}!');
      const result = template.fill({ name: 'World' }).toString();
      expect(result).toBe('Hello, World!\n');
    });

    it('replaces multiple variables', () => {
      const template = write('{{greeting}}, {{name}}! Welcome to {{place}}.');
      const result = template
        .fill({
          greeting: 'Hello',
          name: 'Alice',
          place: 'Wonderland',
        })
        .toString();
      expect(result).toBe('Hello, Alice! Welcome to Wonderland.\n');
    });

    it('is chainable on the result', () => {
      const result = write('Hello, {{name}}!')
        .fill({ name: 'World' })
        .write('How are you?')
        .toString();
      expect(result).toBe('Hello, World!\n\nHow are you?\n');
    });
  });

  describe('section', () => {
    it('creates a section with heading and content', () => {
      const result = write('Intro')
        .section('Guidelines', (w) => {
          w.write('Be helpful.');
        })
        .toString();
      expect(result).toBe('Intro\n\n## Guidelines\n\nBe helpful.\n');
    });
  });

  describe('clone', () => {
    it('creates a copy of the ProseWriter', () => {
      const original = write('Hello');
      const cloned = original.clone();
      expect(cloned.toString()).toBe('Hello\n');
    });

    it('modifications to clone do not affect original', () => {
      const original = write('Hello');
      const cloned = original.clone();
      cloned.write('World');
      expect(original.toString()).toBe('Hello\n');
      expect(cloned.toString()).toBe('Hello\n\nWorld\n');
    });
  });

  describe('table', () => {
    it('creates a markdown table', () => {
      const result = write('Data:')
        .table(
          ['Name', 'Age'],
          [
            ['Alice', '30'],
            ['Bob', '25'],
          ],
        )
        .toString();
      expect(result).toContain('| Name | Age |');
      expect(result).toContain('| --- | --- |');
      expect(result).toContain('| Alice | 30 |');
      expect(result).toContain('| Bob | 25 |');
    });

    it('supports object-based rows', () => {
      const result = write('')
        .table(
          ['Name', 'Age'],
          [
            { Name: 'Alice', Age: 30 },
            { Name: 'Bob', Age: 25 },
          ],
        )
        .toString();
      expect(result).toContain('| Alice | 30 |');
      expect(result).toContain('| Bob | 25 |');
    });

    it('handles ProseWriter in object-based rows', () => {
      const result = write('')
        .table(['Content'], [{ Content: write('hello world') }])
        .toString();
      expect(result).toContain('| hello world |');
    });
  });

  describe('definitions', () => {
    it('creates a definition list from object', () => {
      const result = write('Parameters:')
        .definitions({
          name: 'The user name',
          age: 'The user age',
        })
        .toString();
      expect(result).toContain('**name**: The user name');
      expect(result).toContain('**age**: The user age');
    });
  });

  describe('bold', () => {
    it('wraps content in double asterisks', () => {
      const result = write('This is', bold('important'), 'text.').toString();
      expect(result).toBe('This is **important** text.\n');
    });

    it('is chainable as method', () => {
      const result = write('').bold('one').write('and').bold('two').toString();
      expect(result).toBe('**one**\n\nand\n\n**two**\n');
    });

    it('bold() trims ProseWriter instances', () => {
      const nested = write(' hello ');
      expect(bold(nested)).toBe('**hello**');
    });
  });

  describe('italic', () => {
    it('wraps content in single asterisks', () => {
      const result = write('This is', italic('emphasized'), 'text.').toString();
      expect(result).toBe('This is *emphasized* text.\n');
    });

    it('can be used as a chainable method', () => {
      const result = write('hello').italic('world').toString();
      expect(result).toBe('hello\n\n*world*\n');
    });

    it('italic() trims ProseWriter instances', () => {
      const nested = write(' hello ');
      expect(italic(nested)).toBe('*hello*');
    });
  });

  describe('raw', () => {
    it('appends content without processing', () => {
      const result = write('Before').raw('\n\n\n\nRaw content').toString();
      expect(result).toBe('Before\n\n\n\n\nRaw content');
    });

    it('is chainable', () => {
      const result = write('A').raw('B').write('C').toString();
      expect(result).toBe('A\nB\n\nC\n');
    });
  });

  describe('link', () => {
    it('creates a markdown link', () => {
      const result = write(
        'See',
        link('Google', 'https://google.com'),
        'for more.',
      ).toString();
      expect(result).toBe('See [Google](https://google.com) for more.\n');
    });

    it('can be used as a chainable method', () => {
      const result = write('hello').link('google', 'url').toString();
      expect(result).toBe('hello\n\n[google](url)\n');
    });
  });

  describe('yaml', () => {
    it('creates a YAML code block', () => {
      const result = write('Config:').yaml({ key: 'value' }).toString();
      expect(result).toContain('```yaml');
      expect(result).toContain('key: value');
    });
  });

  describe('compact', () => {
    it('collapses multiple newlines to double newlines', () => {
      const result = write('A').raw('\n\n\n\n\n').write('B').compact().toString();
      expect(result).toBe('A\n\nB\n');
    });
  });

  describe('trim', () => {
    it('removes leading and trailing whitespace', () => {
      const result = write('  hello  ').trim().toString();
      expect(result).toBe('hello\n');
    });
  });

  describe('tokens', () => {
    it('estimates tokens based on character count', () => {
      const result = write('123456789012345').tokens();
      expect(result).toBe(4); // 15 chars + 1 newline = 16 chars / 4 = 4 tokens
    });

    it('rounds up', () => {
      const result = write('12345').tokens();
      expect(result).toBe(2); // 5 chars / 4 = 1.25, rounded up to 2
    });

    it('supports a custom counter function', () => {
      const counter = (text: string) => text.split(/\s+/).filter(Boolean).length;
      const result = write('hello world').tokens(counter);
      expect(result).toBe(2);
    });
  });

  describe('yaml helper', () => {
    it('handles null and undefined', () => {
      expect(write('').yaml(null).toString()).toContain('null');
    });

    it('handles empty arrays and objects', () => {
      expect(write('').yaml([]).toString()).toContain('[]');
      expect(write('').yaml({}).toString()).toContain('{}');
    });

    it('handles other types via fallback', () => {
      const symbol = Symbol('test');
      expect(write('').yaml(symbol).toString()).toContain('null');
    });
  });

  describe('toPlainText', () => {
    it('removes markdown formatting', () => {
      const result = write('').heading(1, 'Title').bold('bold').toPlainText();
      expect(result).toContain('Title');
      expect(result).toContain('bold');
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
    });
  });

  describe('comment', () => {
    it('appends an HTML comment', () => {
      const result = write('Start').comment('Internal note').toString();
      expect(result).toBe('Start\n\n<!-- Internal note -->\n\n');
    });

    it('is chainable', () => {
      const result = write('A').comment('B').write('C').toString();
      expect(result).toBe('A\n\n<!-- B -->\n\nC\n');
    });
  });

  describe('static methods', () => {
    it('ProseWriter.empty creates empty instance', () => {
      expect(ProseWriter.empty().toString()).toBe('');
    });

    it('ProseWriter.join joins multiple writers', () => {
      const a = write('A');
      const b = write('B');
      expect(ProseWriter.join(a, b).toString()).toBe('A\nB\n');
    });

    it('ProseWriter.fromTemplate creates from template string', () => {
      const pw = ProseWriter.fromTemplate('Hello {{name}}');
      expect(pw.toString()).toBe('Hello {{name}}\n');
    });
  });

  describe('type coercion and tags', () => {
    it('has correct Symbol.toStringTag', () => {
      const writer = new ProseWriter();
      expect(Object.prototype.toString.call(writer)).toBe('[object ProseWriter]');
    });

    it('returns string for coercion', () => {
      const writer = write('hello');
      expect(String(writer)).toBe('hello\n');
    });

    it('returns NaN for number coercion', () => {
      const writer = write('hello');
      expect(Number(writer)).toBeNaN();
    });

    it('returns string for default hint', () => {
      const writer = write('hello');
      expect(String(writer)).toBe('hello\n');
    });

    it('delimit() wraps content with custom delimiters', () => {
      const result = write('A').delimit('<<<', '>>>', 'B').toString();
      expect(result).toBe('A\n\n<<<\nB\n>>>\n');
    });

    it('each() iterates over items', () => {
      const result = write('Items:')
        .each(['a', 'b'], (item, w) => w.write(item))
        .toString();
      expect(result).toBe('Items:\n\na\n\nb\n');
    });

    it('toPlainText() handles code blocks and tags', () => {
      const pw = write('').tag('hidden', 'secret').codeblock('js', 'const x = 1;');
      const plain = pw.toPlainText();
      expect(plain).toContain('secret');
      expect(plain).toContain('const x = 1;');
      expect(plain).not.toContain('<hidden>');
      expect(plain).not.toContain('```');
    });
  });
});
