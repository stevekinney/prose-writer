# Prose Writer

A zero-dependency, chainable TypeScript library for building formatted text and markdown strings. Perfect for constructing LLM prompts, generating documentation, or any scenario where you need to programmatically build structured text.

## Why Prose Writer?

Building prompts for LLMs in code is _painful_. You end up with wild stuff like this.

```typescript
// The mess we've all written
const prompt = `You are a ${role}.

## Guidelines
${guidelines.map((g) => `- ${g}`).join('\n')}

## Examples
${examples.map((ex, i) => `### Example ${i + 1}\n${ex}`).join('\n\n')}

<context>
${context}
</context>`;
```

Template literals become unreadable. String concatenation is worse. And when you need conditionals, variables, or reusable pieces? Good luck.

**prose-writer** fixes this:

```typescript
const prompt = write(`You are a ${role}.`)
  .section('Guidelines', (w) => w.list(...guidelines))
  .section('Examples', (w) => {
    w.each(examples, (ex, w, i) => w.heading(3, `Example ${i + 1}`).write(ex));
  })
  .tag('context', context)
  .toString();
```

### What makes it special

- **Zero dependencies** - Keep your project lean and fast
- **Chainable API** - Fluent interface that reads like prose, not code
- **Composable** - Build prompts from reusable pieces with `.append()` and `.clone()`
- **Logical grouping** - Use `.with(builder)` to group related operations
- **Conditional logic** - Add sections conditionally with `.when(condition, builder)`
- **Template variables** - Use `{{placeholders}}` and `.fill()` for dynamic content
- **LLM-optimized** - Built-in `.tag()` for XML delimiters (Claude loves these), `.json()` and `.yaml()` for structured output instructions
- **Batch operations** - Iterate with `.each()` instead of awkward `.map().join()` chains
- **Token awareness** - Estimate prompt size with `.tokens()`
- **Plain text export** - Strip formatting with `.toPlainText()` when you need raw text
- **100% TypeScript** - Full type safety out of the box

### Real-world example

```typescript
import { write, bold, code } from 'prose-writer';

// Define reusable components
const codeReviewPersona = write('You are a', bold('senior software engineer.')).write(
  'Review code for bugs, security issues, and best practices.',
);

const outputFormat = write('').definitions({
  summary: 'Brief overview of findings',
  issues: 'List of problems found',
  suggestions: 'Recommended improvements',
});

// Build the prompt
const reviewPrompt = write('')
  .append(codeReviewPersona)
  .section('Guidelines', (w) => {
    w.list(
      'Focus on correctness over style',
      'Flag security vulnerabilities as critical',
      'Suggest modern alternatives to deprecated patterns',
    );
  })
  .when(strictMode, (w) => w.write('Be extremely thorough. Miss nothing.'))
  .section('Output Format', (w) => w.append(outputFormat))
  .tag('code', userCode)
  .fill({ language: 'TypeScript', framework: 'React' });
```

Stop fighting with template strings. Start writing prompts that are readable, maintainable, and composable.

## Installation

```bash
# Using bun
bun add prose-writer

# Using npm
npm install prose-writer

# Using pnpm
pnpm add prose-writer
```

## Quick Start

```typescript
import { write, bold } from 'prose-writer';

const prompt = write('You are a', bold('helpful assistant.'))
  .write('Please help the user with their request.')
  .toString();

console.log(prompt);
```

Output:

```markdown
You are a **helpful assistant.**
Please help the user with their request.
```

## API Reference

### `write(...content: string[])`

Creates a new `ProseWriter` instance. Multiple arguments are joined with a space, and a newline is added at the end. Can be called with zero arguments to add a blank line between other `write()` calls.

```typescript
import { write, bold, code } from 'prose-writer';

const text = write('Hello', bold('World')).toString();
```

Output:

```markdown
Hello **World**
```

You can also start a chain using `write.with()` if you want to use the builder pattern immediately:

```typescript
const text = write
  .with((w) => {
    w.write('Hello', w.bold('World'));
  })
  .toString();
```

Output:

```markdown
Hello **World**
```

```typescript
const multiLine = write('First line').write('Second line').toString();
```

Output:

```markdown
First line
Second line
```

Adding a blank line between paragraphs:

```typescript
const multiParagraph = write('Paragraph 1').write().write('Paragraph 2').toString();
```

Output:

```markdown
Paragraph 1

Paragraph 2
```

### `.write(...content: string[])`

Appends content to the prose. Multiple arguments are joined with a space, and a newline is added at the end. Returns `this` for chaining.

```typescript
write('User:').write('Hello', 'Assistant').toString();
```

Output:

```markdown
User:
Hello Assistant
```

### Inline Utilities

The following utilities return formatted strings and can be used within `write()` calls or anywhere else.

- `bold(content: string)` - `**content**`
- `italic(content: string)` - `*content*`
- `strike(content: string)` - `~~content~~`
- `code(content: string)` - `` `content` ``
- `inline(content: string)` - Alias for `code()`
- `link(text: string, url: string)` - `[text](url)`
- `image(alt: string, url: string)` - `![alt](url)`

```typescript
import { write, bold, italic, code, link } from 'prose-writer';

write(
  'Check out',
  link('this repo', 'https://github.com...'),
  'for',
  bold('amazing'),
  italic('results'),
  'and see the',
  code('README'),
  'for details.',
);
```

Obviously, you can just write regular Markdown here as well.

### `.nextLine()`

Prevents the next block element or `write()` call from adding a paragraph break. Useful for placing content on consecutive lines.

```typescript
write('Line 1').nextLine().write('Line 2').toString();
```

Output:

```markdown
Line 1
Line 2
```

### `.unorderedList(...items: string[] | number[] | boolean[] | ProseWriter[])`

### `.list(...items: string[] | number[] | boolean[] | ProseWriter[])`

Appends an unordered markdown list. Each item is prefixed with `- `. The list is surrounded by double newlines. Supports nesting by passing another `ProseWriter` instance as an item.

```typescript
write('Features:').unorderedList('Fast', 'Reliable', 'Easy to use').toString();
```

Output:

```markdown
Features:

- Fast
- Reliable
- Easy to use
```

#### Nested Lists

You can create nested lists using a builder function:

```typescript
write('Project Plan:').unorderedList((l) => {
  l.item('Setup');
  l.unorderedList((sl) => {
    sl.item('Install dependencies');
    sl.item('Configure tools');
  });
  l.item('Development');
  l.item('Deployment');
});
```

Output:

```markdown
Project Plan:

- Setup
  - Install dependencies
  - Configure tools
- Development
- Deployment
```

### `.orderedList(...items: string[] | number[] | boolean[] | ProseWriter[])`

Appends an ordered markdown list. Each item is prefixed with its number. The list is surrounded by double newlines. Supports nesting by passing another `ProseWriter` instance as an item.

```typescript
write('Steps:').orderedList('Install', 'Configure', 'Run').toString();
```

Output:

```markdown
Steps:

1. Install
2. Configure
3. Run
```

#### Nested Ordered Lists

```typescript
write('Recipe:').orderedList((l) => {
  l.item('Prepare ingredients');
  l.orderedList((sl) => {
    sl.item('Chop onions');
    sl.item('Mince garlic');
  });
  l.item('Cook');
});
```

Output:

```markdown
Recipe:

1. Prepare ingredients
1. Chop onions
1. Mince garlic
1. Cook
```

### `.heading(level: 1 | 2 | 3 | 4 | 5 | 6, ...content: string[])`

Appends a markdown heading at the specified level. Multiple arguments are joined with a space. Surrounded by double newlines.

```typescript
write('Intro').heading(1, 'Main', 'Title').write('Content').toString();
```

Output:

```markdown
Intro

# Main Title

Content
```

```typescript
write('').heading(2, 'Section').toString();
```

Output:

```markdown
## Section
```

### `.blockquote(...lines: string[])`

Appends a markdown blockquote. Multiple lines are separated by empty blockquote lines. Surrounded by double newlines.

```typescript
write('Note:').blockquote('This is important').toString();
```

Output:

```markdown
Note:

> This is important
```

```typescript
write('Quote:').blockquote('First line', 'Second line').toString();
```

Output:

```markdown
Quote:

> First line
>
> Second line
```

### `.codeblock(language: string, content: string | builder)`

Appends a fenced markdown code block with the specified language. Surrounded by double newlines. The second argument can be a string or a builder function.

```typescript
write('Example:').codeblock('typescript', 'const x = 1;').toString();
```

Output:

````markdown
Example:

```typescript
const x = 1;
```
````

You can also use a builder to construct complex code blocks:

```typescript
write('Setup:').codeblock('bash', (w) => {
  w.write('npm install');
  w.write('npm run build');
});
```

Output:

````markdown
Setup:

```bash
npm install
npm run build
```
````

### `.tasks(builder: (l: ListBuilder) => void)`

### `.tasks(...items: (string | [string, boolean])[])`

Appends a task list with GitHub-style checkboxes.

#### Using a Builder

The builder receives a `ListBuilder` with `task(checked, content)`, `todo(content)`, and `done(content)` methods.

```typescript
write('Todo:').tasks((l) => {
  l.done('Initialize repository');
  l.todo('Implement core logic');
  l.task(false, 'Write documentation');
});
```

Output:

```markdown
Todo:

- [x] Initialize repository
- [ ] Implement core logic
- [ ] Write documentation
```

#### Using Items

You can also pass a list of items directly. Use a string for an unchecked task, or a pair `[content, checked]` for explicit control.

```typescript
write('Todo:').tasks(
  'Default unchecked',
  ['Explicit checked', true],
  ['Explicit unchecked', false],
);
```

Output:

```markdown
Todo:

- [ ] Default unchecked
- [x] Explicit checked
- [ ] Explicit unchecked
```

You can also start a task list immediately:

```typescript
const text = write
  .tasks((l) => {
    l.task(false, 'First task');
  })
  .toString();
```

Output:

```markdown
- [ ] First task
```

### `.callout(type: 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION', content: string | builder)`

Appends a GitHub-style alert (callout). The content can be a string or a builder function.

```typescript
write('Important Info:').callout('NOTE', 'This is a helpful note.');
```

Output:

```markdown
Important Info:

> [!NOTE]
> This is a helpful note.
```

Using a builder for complex callouts:

```typescript
write().callout('WARNING', (w) => {
  w.write('System maintenance scheduled.');
  w.list('Date: Sunday', 'Time: 2:00 AM UTC');
});
```

Output:

```markdown
> [!WARNING]
> System maintenance scheduled.
>
> - Date: Sunday
> - Time: 2:00 AM UTC
```

You can also start a callout immediately:

```typescript
const text = write.callout('TIP', 'Use shortcuts to save time.').toString();
```

Output:

```markdown
> [!TIP]
> Use shortcuts to save time.
```

### `.separator`

A getter that appends a markdown horizontal rule (`---`). Surrounded by double newlines.

```typescript
write('Section 1').separator.write('Section 2').toString();
```

Output:

```markdown
Section 1

---

Section 2
```

### `.json(data: unknown)`

Appends a JSON code block. If the data is not a string, it will be stringified with formatting.

```typescript
write('Config:').json({ key: 'value', count: 42 }).toString();
```

Output:

````markdown
Config:

```json
{
  "key": "value",
  "count": 42
}
```
````

// Also accepts pre-formatted JSON strings

```typescript
write('').json('{"raw": "json"}').toString();
```

Output:

````markdown
```json
{ "raw": "json" }
```
````

### `.append(writer: ProseWriter)`

Appends the content from another `ProseWriter` instance. Enables composition of prompts from reusable pieces.

```typescript
const persona = write('You are an expert TypeScript developer.');
const guidelines = write('').list('Be concise', 'Be accurate');

const prompt = write('System Prompt')
  .heading(2, 'Role')
  .append(persona)
  .heading(2, 'Guidelines')
  .append(guidelines)
  .toString();
```

### `.when(condition: unknown, builder: (writer) => void)`

Conditionally executes a builder function. If the condition is truthy, the builder is called with the writer instance.

```typescript
const includeExamples = true;
const strictMode = false;

write('You are a coding assistant.')
  .when(strictMode, (w) => w.write('Be extremely precise.'))
  .when(includeExamples, (w) => {
    w.heading(2, 'Examples').list('Example 1', 'Example 2');
  })
  .toString();
```

### `.with(builder: (writer) => void)`

Executes a builder function with the writer instance. Useful for logical grouping in chains. The writer passed to the builder has all inline formatters (like `bold`, `italic`, etc.) available as methods, so you don't need to import them.

```typescript
write('Report')
  .with((w) => {
    w.write('Section 1');
    w.write('This is', w.bold('important'));
  })
  .toString();
```

### `.tag(name: string, content: string | ProseWriter | builder)`

Wraps content in XML-style tags. Useful for Claude and other models that respond well to XML delimiters. The second argument can be a string, another `ProseWriter` instance, or a builder function.

```typescript
write('Analyze this document:')
  .tag('document', 'The content to analyze goes here.')
  .tag('instructions', 'Summarize the key points.')
  .toString();
```

Output:

```markdown
Analyze this document:

<document>
The content to analyze goes here.
</document>

<instructions>
Summarize the key points.
</instructions>
```

You can also use a builder for complex nested content:

```typescript
write('').tag('system', (w) => {
  w.write('Be helpful');
  w.write('Be concise');
});
```

Output:

```markdown
<system>
Be helpful
Be concise
</system>
```

### `.code(content: string)`

Appends inline code wrapped in backticks. Returns `this` for chaining. Use the `code()` or `inline()` utility for cleaner inline usage.

```typescript
write('Use the').code('calculateTotal').write('function.').toString();
```

Output:

```markdown
Use the
`calculateTotal`
function.
```

// Recommended:

```typescript
import { write, code } from 'prose-writer';
write('Use the', code('calculateTotal'), 'function.').toString();
```

Output:

```markdown
Use the `calculateTotal` function.
```

### `.fill(variables: Record<string, string>)`

Replaces template variables in the format `{{variableName}}` with provided values. Returns a new `ProseWriter` with the substitutions applied (does not modify the original).

```typescript
const template = write('Hello, {{name}}! Welcome to {{place}}.');
const result = template.fill({ name: 'Alice', place: 'Wonderland' }).toString();
```

Output:

```markdown
Hello, Alice! Welcome to Wonderland.
```

### `.section(name: string, builder: (writer) => void, level?: 1-6)`

Creates a semantic section with a heading and content built by the builder function. The optional `level` parameter defaults to 2.

```typescript
write('Document')
  .section('Introduction', (w) => {
    w.write('This is the intro paragraph.');
  })
  .section('Features', (w) => {
    w.list('Fast', 'Reliable', 'Easy to use');
  })
  .toString();
```

### `.clone()`

Creates a copy of the `ProseWriter` with the same content. Useful for creating variations of a base prompt without modifying the original.

```typescript
const base = write('You are an assistant.').heading(2, 'Guidelines');

const verbose = base.clone().write('Be very detailed and thorough.');
const concise = base.clone().write('Be brief and to the point.');
```

### `.table(headers: string[], rows: string[][])`

Appends a markdown table with headers and rows. Surrounded by double newlines.

```typescript
write('User Data:')
  .table(
    ['Name', 'Role', 'Status'],
    [
      ['Alice', 'Admin', 'Active'],
      ['Bob', 'User', 'Pending'],
      ['Charlie', 'User', 'Active'],
    ],
  )
  .toString();
```

Output:

```markdown
User Data:

| Name    | Role  | Status  |
| ------- | ----- | ------- |
| Alice   | Admin | Active  |
| Bob     | User  | Pending |
| Charlie | User  | Active  |
```

### `.definitions(obj: Record<string, string>)`

Appends a definition list with key-value pairs. Each key is bolded.

```typescript
write('Parameters:')
  .definitions({
    temperature: 'Controls randomness (0-1)',
    maxTokens: 'Maximum response length',
  })
  .toString();
```

Output:

```markdown
Parameters:

**temperature**: Controls randomness (0-1)
**maxTokens**: Maximum response length
```

### `.bold(content: string)`

Appends bold text wrapped in double asterisks. Returns `this` for chaining. Use the `bold()` utility for cleaner inline usage.

```typescript
write('This is').bold('important').write('information.').toString();
```

Output:

```markdown
This is
**important**
information.
```

// Recommended:

```typescript
import { write, bold } from 'prose-writer';
write('This is', bold('important'), 'information.').toString();
```

Output:

```markdown
This is **important** information.
```

### `.italic(content: string)`

Appends italic text wrapped in single asterisks. Returns `this` for chaining. Use the `italic()` utility for cleaner inline usage.

```typescript
write('Please').italic('note').write('the following.').toString();
```

Output:

```markdown
Please
_note_
the following.
```

// Recommended:

```typescript
import { write, italic } from 'prose-writer';
write('Please', italic('note'), 'the following.').toString();
```

Output:

```markdown
Please _note_ the following.
```

### `.comment(content: string)`

Appends an HTML comment. Useful for adding notes to LLM prompts that shouldn't appear in rendered output.

```typescript
write('Prompt').comment('This is a hidden note').write('End');
```

Output:

```markdown
Prompt

<!-- This is a hidden note -->

End
```

### `.strike(content: string)`

Appends strikethrough text. Returns `this` for chaining. Use the `strike()` utility for cleaner inline usage.

```typescript
write('Old').strike('deprecated').write('New').toString();
```

Output:

```markdown
Old

~~deprecated~~

New
```

// Recommended:

```typescript
import { write, strike } from 'prose-writer';
write('Price:', strike('$100'), '$80').toString();
```

Output:

```markdown
Price: ~~$100~~ $80
```

### `.image(alt: string, url: string)`

Appends a markdown image. Returns `this` for chaining. Use the `image()` utility for cleaner inline usage.

```typescript
write('Photo:').image('A cat', 'https://example.com/cat.jpg').toString();
```

Output:

```markdown
Photo:

![A cat](https://example.com/cat.jpg)
```

Appends content without any processing. Useful for injecting pre-formatted content.

```typescript
const preformatted = '  indented\n\ttabbed\n\n\nmultiple newlines';
write('').raw(preformatted).toString();
// Preserves all whitespace exactly as provided
```

### `.link(text: string, url: string)`

Appends a markdown link. Returns `this` for chaining. Use the `link()` utility for cleaner inline usage.

```typescript
write('See the')
  .link('documentation', 'https://example.com')
  .write('for details.')
  .toString();
```

Output:

```markdown
See the
[documentation](https://example.com)
for details.
```

// Recommended:

```typescript
import { write, link } from 'prose-writer';
write('See the', link('documentation', 'https://example.com'), 'for details.').toString();
```

Output:

```markdown
See the [documentation](https://example.com) for details.
```

### `.yaml(data: unknown)`

Appends a YAML code block. If data is not a string, it will be converted to YAML format.

```typescript
write('Configuration:')
  .yaml({
    model: 'gpt-4',
    temperature: 0.7,
    settings: {
      stream: true,
    },
  })
  .toString();
```

Output:

````markdown
Configuration:

```yaml
model: gpt-4
temperature: 0.7
settings:
  stream: true
```
````

### `.delimit(open: string, close: string, content: string | ProseWriter)`

Wraps content with custom delimiters. Useful for models that respond to specific delimiter patterns.

```typescript
write('Input:').delimit('###', '###', 'content here').toString();
```

### `.compact()`

Returns a new ProseWriter with consecutive newlines (3+) collapsed to double newlines.

```typescript
const prose = write('A').raw('\n\n\n\n\n').write('B');
prose.compact().toString();
```

Output:

```markdown
A

B
```

### `.trim()`

Returns a new ProseWriter with leading and trailing whitespace removed.

```typescript
write('  hello  ').trim().toString();
```

Output:

```markdown
hello
```

### `.tokens(counter?: (content: string) => number)`

Returns an estimated token count. By default, it uses a rough approximation of ~4 characters per token. You can provide an optional counter function for more accurate counting (e.g., using a library like `tiktoken`).

```typescript
const prompt = write('Hello world, this is a test.');
console.log(prompt.tokens());
```

Output:

```markdown
8
```

Using a custom counter:

```typescript
import { countTokens } from 'some-token-library';
const prompt = write('Hello world');
const tokenCount = prompt.tokens((content) => countTokens(content));
```

### `.each<T>(items: T[], builder: (item, writer, index) => void)`

Iterates over items and applies a builder function for each.

```typescript
const features = ['Fast', 'Reliable', 'Easy'];
write('Features:')
  .each(features, (feature, w, i) => {
    w.heading(3, `${i + 1}. ${feature}`);
  })
  .toString();
```

Output:

```markdown
Features:

### 1. Fast

### 2. Reliable

### 3. Easy
```

### `.toPlainText()`

Converts the prose to plain text by stripping all markdown formatting.

```typescript
import { write, bold } from 'prose-writer';

const prose = write('')
  .heading(1, 'Title')
  .write('Some', bold('bold'), 'text.')
  .list('Item 1', 'Item 2');

prose.toPlainText();
```

### `ProseWriter.empty()`

Static method that creates an empty ProseWriter instance.

```typescript
const writer = ProseWriter.empty();
writer.write('Content').heading(1, 'Title');
```

### `ProseWriter.join(...writers: ProseWriter[])`

Static method that joins multiple ProseWriter instances into one.

```typescript
const intro = write('Introduction');
const body = write('').heading(2, 'Body').list('Point 1', 'Point 2');
const conclusion = write('').heading(2, 'Conclusion').write('Summary');

const document = ProseWriter.join(intro, body, conclusion);
```

### `ProseWriter.fromTemplate(template: string)`

Static method that creates a ProseWriter from a template string.

```typescript
const prompt = ProseWriter.fromTemplate('Hello {{name}}, your role is {{role}}.').fill({
  name: 'Alice',
  role: 'developer',
});
```

### `.toString()`

Converts the accumulated prose to a string.

```typescript
const text = write('Hello', 'World').toString();
```

Output:

```markdown
Hello World
```

### String Coercion

`ProseWriter` instances can be converted to strings using `String()` or template literals:

```typescript
const prose = write('Hello', 'World');

String(prose);
```

Output:

```markdown
Hello World
```

```typescript
`${prose}`;
```

Output:

```markdown
Hello World
```

## Building Complex Documents

Chain methods together to build structured documents:

```typescript
import { write } from 'prose-writer';

const documentation = write('Welcome to MyAPI')
  .heading(1, 'API Documentation')
  .write('This document describes how to use MyAPI.')
  .heading(2, 'Features')
  .list('RESTful endpoints', 'JSON responses', 'Authentication support')
  .heading(2, 'Getting Started')
  .orderedList('Sign up for an API key', 'Install the SDK', 'Make your first request')
  .heading(2, 'Example Request')
  .codeblock(
    'typescript',
    `import { MyAPI } from 'myapi';

const api = new MyAPI({ key: 'your-api-key' });
const result = await api.getData();`,
  )
  .heading(2, 'Response Format')
  .json({
    success: true,
    data: {
      id: 123,
      name: 'Example',
    },
  })
  .heading(2, 'Important Notes')
  .blockquote('Always keep your API key secure.', 'Rate limits apply to all endpoints.')
  .separator.write('For more information, visit our website.')
  .toString();
```

## LLM Prompt Building

`prose-writer` is particularly useful for building LLM prompts with composable, reusable pieces:

```typescript
import { write } from 'prose-writer';

// Define reusable prompt components
const persona = write('You are a helpful coding assistant.').write(
  'Your role is to help users write clean, maintainable code.',
);

const guidelines = write('').list(
  'Provide clear explanations',
  'Include code examples when helpful',
  'Suggest best practices',
  'Point out potential issues',
);

// Build the system prompt with composition and conditionals
const includeExamples = true;
const useStructuredOutput = true;

const systemPrompt = write('')
  .append(persona)
  .heading(2, 'Guidelines')
  .append(guidelines)
  .when(includeExamples, (w) => {
    w.heading(2, 'Example')
      .write('When asked about the ')
      .code('map')
      .write(' function, explain its purpose and show usage.');
  })
  .when(useStructuredOutput, (w) => {
    w.tag('output_format', 'Respond in markdown with code examples.');
  })
  .toString();

// Build a user prompt with XML tags (great for Claude)
const userPrompt = write('Please review the following code:')
  .tag(
    'code',
    `function add(a, b) {
  return a + b;
}`,
  )
  .tag('question', 'Is this good TypeScript code? What improvements would you suggest?')
  .toString();
```

## Prompt Templates and Variations

Use `fill()` for variable interpolation and `clone()` to create prompt variations:

```typescript
import { write } from 'prose-writer';

// Create a reusable template
const promptTemplate = write('You are a {{role}}.')
  .section('Task', (w) => {
    w.write('Help the user with {{task}}.');
  })
  .section('Guidelines', (w) => {
    w.list('Be {{style}}', 'Focus on {{focus}}');
  })
  .section('Output', (w) => {
    w.table(
      ['Format', 'When to use'],
      [
        ['Code blocks', 'For code examples'],
        ['Bullet points', 'For lists of items'],
        ['Tables', 'For structured data'],
      ],
    );
  });

// Create variations for different use cases
const codeReviewPrompt = promptTemplate.fill({
  role: 'senior software engineer',
  task: 'code review',
  style: 'thorough and constructive',
  focus: 'code quality and best practices',
});

const debuggingPrompt = promptTemplate.fill({
  role: 'debugging expert',
  task: 'finding and fixing bugs',
  style: 'systematic and methodical',
  focus: 'root cause analysis',
});

// Or use clone() for structural variations
const basePrompt = write('You are an AI assistant.').section('Core Guidelines', (w) => {
  w.list('Be helpful', 'Be accurate');
});

const verbosePrompt = basePrompt
  .clone()
  .section('Style', (w) => w.write('Provide detailed explanations.'));

const concisePrompt = basePrompt
  .clone()
  .section('Style', (w) => w.write('Be brief and to the point.'));
```

## Using the Class Directly

You can also use the `ProseWriter` class directly:

```typescript
import { ProseWriter } from 'prose-writer';

const writer = new ProseWriter('Initial content');
writer.write(' more content');
writer.heading(1, 'Title');

console.log(writer.toString());
```

Or create an empty instance:

```typescript
const writer = new ProseWriter();
writer.heading(1, 'Document Title');
writer.write('Content goes here.');
```

## TypeScript Support

`prose-writer` is written in TypeScript and provides full type definitions out of the box.

```typescript
import { write, ProseWriter } from 'prose-writer';

// Type-safe heading levels
write('').heading(1, 'Valid'); // OK
write('').heading(7, 'Invalid'); // Type error: Argument of type '7' is not assignable

// ProseWriter type
const myWriter: ProseWriter = write('Hello');
```
