/**
 * Inline formatting utilities that can be used within write() or builder functions.
 * These return strings and do not side-effect the writer.
 */
export interface InlineUtils {
  bold: (content: string | number | boolean | ProseWriter) => string;
  italic: (content: string | number | boolean | ProseWriter) => string;
  code: (content: string | number | boolean | ProseWriter) => string;
  inline: (content: string | number | boolean | ProseWriter) => string;
  strike: (content: string | number | boolean | ProseWriter) => string;
  link: (text: string | ProseWriter, url: string) => string;
  image: (alt: string | ProseWriter, url: string) => string;
}

/**
 * Builder for markdown lists.
 */
export interface ListBuilder extends InlineUtils {
  item(...content: (string | number | boolean | ProseWriter)[]): this;
  task(checked: boolean, ...content: (string | number | boolean | ProseWriter)[]): this;
  todo(...content: (string | number | boolean | ProseWriter)[]): this;
  done(...content: (string | number | boolean | ProseWriter)[]): this;
  comment(content: string): this;
  unorderedList(builder: (l: ListBuilder) => void): this;
  unorderedList(...items: (string | number | boolean | ProseWriter)[]): this;
  list(builder: (l: ListBuilder) => void): this;
  list(...items: (string | number | boolean | ProseWriter)[]): this;
  orderedList(builder: (l: ListBuilder) => void): this;
  orderedList(...items: (string | number | boolean | ProseWriter)[]): this;
}

/**
 * A chainable prose writer for building formatted text/markdown strings.
 */
export class ProseWriter {
  private parts: string[] = [];
  private _skipNextPadding = false;

  constructor(content?: string) {
    if (content !== undefined) {
      this.parts.push(content.endsWith('\n') ? content : content + '\n');
    }
  }

  /**
   * Appends content to the prose.
   * Multiple arguments are joined with a space.
   * Chaining write() calls creates separate paragraphs by default.
   */
  write(...content: (string | number | boolean | ProseWriter)[]): this {
    const joined = content
      .map((c) => {
        if (c instanceof ProseWriter) {
          return c.toString().trimEnd();
        }
        return String(c);
      })
      .join(' ');

    if (this.parts.length === 0 && joined.length === 0) {
      return this;
    }

    const p = this.padding;
    this.parts.push(p + joined + '\n');
    return this;
  }

  /**
   * Prevents the next block element or write() call from adding a paragraph break.
   * Useful for placing two write() calls on consecutive lines.
   */
  nextLine(): this {
    this._skipNextPadding = true;
    return this;
  }

  /**
   * Appends an unordered list.
   * Each item is prefixed with `- ` on its own line.
   * Supports nesting by passing another ProseWriter instance or a builder function.
   */
  unorderedList(builder: (l: ListBuilder) => void): this;
  unorderedList(...items: (string | number | boolean | ProseWriter)[]): this;
  unorderedList(
    ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
  ): this {
    if (args.length === 1 && typeof args[0] === 'function') {
      const { builder, getItems } = this.createListBuilder();
      (args[0] as (l: ListBuilder) => void)(builder);
      return this.unorderedList(...getItems());
    }

    const items = args as (string | number | boolean | ProseWriter)[];
    const listContent = items
      .map((item) => {
        if (item instanceof ProseWriter) {
          return item
            .toString()
            .trimEnd()
            .split('\n')
            .map((line) => `  ${line}`)
            .join('\n');
        }
        return `- ${item}`;
      })
      .join('\n');
    this.parts.push(`${this.padding}${listContent}\n\n`);
    return this;
  }

  /**
   * Alias for unorderedList().
   */
  list(builder: (l: ListBuilder) => void): this;
  list(...items: (string | number | boolean | ProseWriter)[]): this;
  list(
    ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
  ): this {
    if (args.length === 1 && typeof args[0] === 'function') {
      return this.unorderedList(args[0] as (l: ListBuilder) => void);
    }
    return this.unorderedList(...(args as (string | number | boolean | ProseWriter)[]));
  }

  /**
   * Appends an ordered list.
   * Each item is prefixed with its number on its own line.
   * Supports nesting by passing another ProseWriter instance or a builder function.
   */
  orderedList(builder: (l: ListBuilder) => void): this;
  orderedList(...items: (string | number | boolean | ProseWriter)[]): this;
  orderedList(
    ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
  ): this {
    if (args.length === 1 && typeof args[0] === 'function') {
      const { builder, getItems } = this.createListBuilder();
      (args[0] as (l: ListBuilder) => void)(builder);
      return this.orderedList(...getItems());
    }

    let index = 1;
    const items = args as (string | number | boolean | ProseWriter)[];
    const listContent = items
      .map((item) => {
        if (item instanceof ProseWriter) {
          return item
            .toString()
            .trimEnd()
            .split('\n')
            .map((line) => `  ${line}`)
            .join('\n');
        }
        return `${index++}. ${item}`;
      })
      .join('\n');
    this.parts.push(`${this.padding}${listContent}\n\n`);
    return this;
  }

  /**
   * Appends a task list with checkboxes.
   */
  tasks(builder: (l: ListBuilder) => void): this;
  tasks(
    ...items: (
      | string
      | number
      | boolean
      | ProseWriter
      | [string | number | boolean | ProseWriter, boolean]
    )[]
  ): this;
  tasks(
    ...args:
      | [(l: ListBuilder) => void]
      | (
          | string
          | number
          | boolean
          | ProseWriter
          | [string | number | boolean | ProseWriter, boolean]
        )[]
  ): this {
    if (args.length === 1 && typeof args[0] === 'function') {
      const { builder, getItems } = this.createListBuilder();
      (args[0] as (l: ListBuilder) => void)(builder);
      const items = getItems();
      const listContent = items
        .map((item) => {
          if (item instanceof ProseWriter) {
            return item
              .toString()
              .trimEnd()
              .split('\n')
              .map((line) => `  ${line}`)
              .join('\n');
          }
          return `- ${item}`;
        })
        .join('\n');
      this.parts.push(`${this.padding}${listContent}\n\n`);
      return this;
    }

    const items = (
      args as (
        | string
        | number
        | boolean
        | ProseWriter
        | [string | number | boolean | ProseWriter, boolean]
      )[]
    ).map((arg) => {
      if (Array.isArray(arg) && arg.length === 2 && typeof arg[1] === 'boolean') {
        const [content, checked] = arg;
        const checkbox = checked ? '[x] ' : '[ ] ';
        const text = write(content).toString().trimEnd();
        return checkbox + text;
      }
      const checkbox = '[ ] ';
      const text = write(arg as string | number | boolean | ProseWriter)
        .toString()
        .trimEnd();
      return checkbox + text;
    });

    const listContent = items.map((item) => `- ${item}`).join('\n');
    this.parts.push(`${this.padding}${listContent}\n\n`);
    return this;
  }

  /**
   * Appends a markdown heading at the specified level.
   */
  heading(level: 1 | 2 | 3 | 4 | 5 | 6, ...content: string[]): this {
    const hashes = '#'.repeat(level);
    const joined = content.join(' ');
    this.parts.push(`${this.padding}${hashes} ${joined}\n\n`);
    return this;
  }

  /**
   * Appends a blockquote with the given lines.
   * Lines are separated by an empty blockquote line.
   */
  blockquote(...lines: string[]): this {
    const quotedLines = lines.map((line) => `> ${line}`).join('\n>\n');
    this.parts.push(`${this.padding}${quotedLines}\n\n`);
    return this;
  }

  /**
   * Appends a fenced code block with the specified language.
   */
  codeblock(
    language: string,
    content: string | ((writer: ProseWriter & InlineUtils) => void),
  ): this {
    let code: string;
    if (typeof content === 'function') {
      const writer = new ProseWriter();
      content(writer.enhanced);
      code = writer.toString().trim();
    } else {
      code = content;
    }
    this.parts.push(`${this.padding}\`\`\`${language}\n${code}\n\`\`\`\n\n`);
    return this;
  }

  /**
   * Appends a horizontal separator.
   */
  get separator(): this {
    this.parts.push(`${this.padding}---\n\n`);
    return this;
  }

  /**
   * Appends a JSON code block.
   * If data is not a string, it will be stringified with formatting.
   */
  json(data: unknown): this {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return this.codeblock('json', jsonString);
  }

  /**
   * Appends the content from another ProseWriter instance.
   * Enables composition of prompts from reusable pieces.
   */
  append(writer: ProseWriter): this {
    const content = writer.toString();
    if (content.length > 0) {
      this.parts.push(this.padding + content);
    }
    return this;
  }

  /**
   * Returns a version of this writer with inline formatters as methods.
   * This is passed to builder functions to allow using formatters without imports.
   */
  private get enhanced(): this & InlineUtils {
    const formatters: Record<string, unknown> = {
      bold,
      italic,
      code,
      inline,
      link,
      strike,
      image,
    };
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === 'string' && prop in formatters) {
          return formatters[prop];
        }
        const val = Reflect.get(target, prop, target) as unknown;
        if (typeof val === 'function') {
          return (val as (...args: unknown[]) => unknown).bind(target);
        }
        return val;
      },
    }) as this & InlineUtils;
  }

  /**
   * Conditionally executes a builder function.
   * If the condition is truthy, the builder is called with this instance.
   */
  when(condition: unknown, builder: (writer: this & InlineUtils) => void): this {
    if (condition) {
      builder(this.enhanced);
    }
    return this;
  }

  /**
   * Executes a builder function with this instance.
   * Useful for logical grouping in chains.
   */
  with(builder: (writer: this & InlineUtils) => void): this {
    builder(this.enhanced);
    return this;
  }

  /**
   * Wraps content in XML-style tags.
   * Useful for Claude and other models that respond well to XML delimiters.
   */
  tag(
    name: string,
    content: string | ProseWriter | ((writer: ProseWriter & InlineUtils) => void),
  ): this {
    let contentString: string;
    if (typeof content === 'function') {
      const writer = new ProseWriter();
      content(writer.enhanced);
      contentString = writer.toString();
    } else {
      contentString = content instanceof ProseWriter ? content.toString() : content;
    }
    this.parts.push(`${this.padding}<${name}>\n${contentString.trimEnd()}\n</${name}>\n`);
    return this;
  }

  /**
   * Appends inline code (wrapped in backticks).
   */
  code(content: string | number | boolean | ProseWriter): this {
    this.parts.push(this.padding + code(content) + '\n');
    return this;
  }

  /**
   * Replaces template variables in the format {{variableName}} with provided values.
   * Returns a new ProseWriter with the substitutions applied.
   */
  fill(variables: Record<string, string>): ProseWriter {
    const content = this.toString();
    const filled = content.replace(/\{\{(\w+)\}\}/g, (match, key: string): string => {
      return variables[key] ?? match;
    });
    return new ProseWriter(filled);
  }

  /**
   * Creates a semantic section with a heading and content built by the builder function.
   * @param name - The section heading text
   * @param builder - A function that receives a fresh ProseWriter to build section content
   * @param level - Optional heading level (defaults to 2)
   */
  section(
    name: string,
    builder: (writer: ProseWriter & InlineUtils) => void,
    level: 1 | 2 | 3 | 4 | 5 | 6 = 2,
  ): this {
    const sectionWriter = new ProseWriter();
    builder(sectionWriter.enhanced);
    const hashes = '#'.repeat(level);
    this.parts.push(`${this.padding}${hashes} ${name}\n\n${sectionWriter.toString()}`);
    return this;
  }

  /**
   * Creates a copy of this ProseWriter with the same content.
   * Useful for creating variations of a base prompt.
   */
  clone(): ProseWriter {
    const cloned = new ProseWriter();
    cloned.parts = [...this.parts];
    return cloned;
  }

  /**
   * Appends a markdown table with headers and rows.
   * Type-safe: Each row can be an array of strings matching the header length,
   * or an object where keys match the header names.
   */
  table<T extends string>(
    headers: [...T[]],
    rows: (string[] | Record<T, string | number | boolean | ProseWriter>)[],
  ): this {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;

    const dataRows = rows
      .map((row) => {
        const values = Array.isArray(row)
          ? row
          : headers.map((h) => {
              const val = row[h];
              if (val instanceof ProseWriter) return val.toPlainText();
              return String(val ?? '');
            });
        return `| ${values.join(' | ')} |`;
      })
      .join('\n');

    this.parts.push(`${this.padding}${headerRow}\n${separatorRow}\n${dataRows}\n\n`);
    return this;
  }

  /**
   * Appends a definition list with key-value pairs.
   * Each key is bolded, followed by a colon and the value.
   */
  definitions(obj: Record<string, string>): this {
    const entries = Object.entries(obj)
      .map(([key, value]) => `**${key}**: ${value}`)
      .join('\n');
    this.parts.push(`${this.padding}${entries}\n\n`);
    return this;
  }

  /**
   * Appends bold text.
   */
  bold(content: string | number | boolean | ProseWriter): this {
    this.parts.push(this.padding + bold(content) + '\n');
    return this;
  }

  /**
   * Appends italic text.
   */
  italic(content: string | number | boolean | ProseWriter): this {
    this.parts.push(this.padding + italic(content) + '\n');
    return this;
  }

  /**
   * Appends strikethrough text.
   */
  strike(content: string | number | boolean | ProseWriter): this {
    this.parts.push(this.padding + strike(content) + '\n');
    return this;
  }

  /**
   * Appends raw content without any processing.
   */
  raw(content: string): this {
    this.parts.push(content);
    return this;
  }

  /**
   * Appends a markdown link.
   */
  link(text: string | ProseWriter, url: string): this {
    this.parts.push(this.padding + link(text, url) + '\n');
    return this;
  }

  /**
   * Appends a markdown image.
   */
  image(alt: string | ProseWriter, url: string): this {
    this.parts.push(this.padding + image(alt, url) + '\n');
    return this;
  }

  /**
   * Appends an HTML comment.
   */
  comment(content: string): this {
    this.parts.push(`${this.padding}<!-- ${content} -->\n\n`);
    return this;
  }

  /**
   * Appends a YAML code block.
   * If data is not a string, it will be converted to YAML format.
   */
  yaml(data: unknown): this {
    const yamlString = typeof data === 'string' ? data : this.toYamlString(data);
    return this.codeblock('yaml', yamlString);
  }

  /**
   * Converts a value to a simple YAML string representation.
   */
  private toYamlString(data: unknown, indent: number = 0): string {
    const prefix = '  '.repeat(indent);

    if (data === null || data === undefined) {
      return 'null';
    }

    if (typeof data === 'string') {
      // Quote strings that contain special characters
      if (/[:\n#"']/.test(data) || data === '') {
        return `"${data.replace(/"/g, '\\"')}"`;
      }
      return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      return data
        .map((item) => `${prefix}- ${this.toYamlString(item, indent + 1)}`)
        .join('\n');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>);
      if (entries.length === 0) return '{}';
      return entries
        .map(([key, value]) => {
          const valueStr = this.toYamlString(value, indent + 1);
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `${prefix}${key}:\n${valueStr}`;
          }
          if (Array.isArray(value)) {
            return `${prefix}${key}:\n${valueStr}`;
          }
          return `${prefix}${key}: ${valueStr}`;
        })
        .join('\n');
    }

    // Fallback for any other types - use JSON stringify
    return JSON.stringify(data) ?? 'null';
  }

  /**
   * Wraps content with custom delimiters.
   */
  delimit(open: string, close: string, content: string | ProseWriter): this {
    const contentString = content instanceof ProseWriter ? content.toString() : content;
    this.parts.push(`${this.padding}${open}\n${contentString}\n${close}\n`);
    return this;
  }

  /**
   * Returns a new ProseWriter with consecutive newlines collapsed to double newlines.
   */
  compact(): ProseWriter {
    const content = this.toString().replace(/\n{3,}/g, '\n\n');
    return new ProseWriter(content);
  }

  /**
   * Returns a new ProseWriter with leading and trailing whitespace removed.
   */
  trim(): ProseWriter {
    const content = this.toString().trim();
    return new ProseWriter(content);
  }

  /**
   * Estimates the number of tokens in the prose.
   * By default, uses a rough approximation of ~4 characters per token.
   * An optional counter function can be provided for more accurate counting.
   */
  tokens(counter?: (content: string) => number): number {
    const content = this.toString();
    if (counter) {
      return counter(content);
    }
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(content.length / 4);
  }

  /**
   * Iterates over items and applies a builder function for each.
   */
  each<T>(
    items: T[],
    builder: (item: T, writer: this & InlineUtils, index: number) => void,
  ): this {
    items.forEach((item, index) => {
      builder(item, this.enhanced, index);
    });
    return this;
  }

  /**
   * Converts the prose to plain text by stripping markdown formatting.
   */
  toPlainText(): string {
    let text = this.toString();

    // Remove code blocks (preserve content)
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      const lines = match.split('\n');
      return lines.slice(1, -1).join('\n');
    });

    // Remove inline code backticks
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove headings (keep text)
    text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');

    // Remove bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');

    // Remove italic
    text = text.replace(/\*([^*]+)\*/g, '$1');

    // Remove links (keep text)
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove blockquote markers
    text = text.replace(/^>\s?/gm, '');

    // Remove horizontal rules
    text = text.replace(/^---$/gm, '');

    // Remove list markers
    text = text.replace(/^[-*]\s+/gm, '');
    text = text.replace(/^\d+\.\s+/gm, '');

    // Remove XML tags (keep content)
    text = text.replace(/<[^>]+>/g, '');

    // Remove table formatting
    text = text.replace(/\|/g, ' ');
    text = text.replace(/^[\s-]+$/gm, '');

    // Collapse multiple spaces
    text = text.replace(/ {2,}/g, ' ');

    // Collapse multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  }

  /**
   * Returns necessary newline padding if there is existing content.
   * Ensures exactly two newlines (a paragraph break) before a block element.
   */
  private get padding(): string {
    if (this._skipNextPadding || this.parts.length === 0) {
      this._skipNextPadding = false;
      return '';
    }
    const lastPart = this.parts[this.parts.length - 1]!;
    if (lastPart.endsWith('\n\n')) return '';
    if (lastPart.endsWith('\n')) return '\n';
    return '\n\n';
  }

  /**
   * Internal helper to create a list builder.
   */
  private createListBuilder(): {
    builder: ListBuilder;
    getItems: () => (string | number | boolean | ProseWriter)[];
  } {
    const items: (string | number | boolean | ProseWriter)[] = [];
    const lb: ListBuilder = {
      item: (...content: (string | number | boolean | ProseWriter)[]) => {
        items.push(
          write(...content)
            .toString()
            .trimEnd(),
        );
        return lb;
      },
      task: (
        checked: boolean,
        ...content: (string | number | boolean | ProseWriter)[]
      ) => {
        const checkbox = checked ? '[x] ' : '[ ] ';
        const text = write(...content)
          .toString()
          .trimEnd();
        items.push(checkbox + text);
        return lb;
      },
      todo: (...content: (string | number | boolean | ProseWriter)[]) =>
        lb.task(false, ...content),
      done: (...content: (string | number | boolean | ProseWriter)[]) =>
        lb.task(true, ...content),
      unorderedList: (
        ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
      ) => {
        const sub = new ProseWriter();
        if (args.length === 1 && typeof args[0] === 'function') {
          sub.unorderedList(args[0] as (l: ListBuilder) => void);
        } else {
          sub.unorderedList(...(args as (string | number | boolean | ProseWriter)[]));
        }
        items.push(sub);
        return lb;
      },
      list: (
        ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
      ) => {
        const sub = new ProseWriter();
        if (args.length === 1 && typeof args[0] === 'function') {
          sub.list(args[0] as (l: ListBuilder) => void);
        } else {
          sub.list(...(args as (string | number | boolean | ProseWriter)[]));
        }
        items.push(sub);
        return lb;
      },
      orderedList: (
        ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
      ) => {
        const sub = new ProseWriter();
        if (args.length === 1 && typeof args[0] === 'function') {
          sub.orderedList(args[0] as (l: ListBuilder) => void);
        } else {
          sub.orderedList(...(args as (string | number | boolean | ProseWriter)[]));
        }
        items.push(sub);
        return lb;
      },
      comment: (content: string) => {
        const sub = new ProseWriter();
        sub.comment(content);
        items.push(sub);
        return lb;
      },
      bold,
      italic,
      code,
      inline,
      strike,
      link,
      image,
    };
    return { builder: lb, getItems: () => items };
  }

  /**
   * Creates an empty ProseWriter instance.
   */
  static empty(): ProseWriter {
    return new ProseWriter();
  }

  /**
   * Joins multiple ProseWriter instances into one.
   */
  static join(...writers: ProseWriter[]): ProseWriter {
    const result = new ProseWriter();
    for (const writer of writers) {
      result.parts.push(writer.toString());
    }
    return result;
  }

  /**
   * Creates a ProseWriter from a template string.
   */
  static fromTemplate(template: string): ProseWriter {
    return new ProseWriter(template);
  }

  /**
   * Converts the accumulated prose to a string.
   */
  toString(): string {
    return this.parts.join('');
  }

  /**
   * Returns the primitive value (string) for type coercion.
   */
  [Symbol.toPrimitive](hint: string): string | number {
    if (hint === 'number') {
      return Number.NaN;
    }
    return this.toString();
  }

  /**
   * Returns the string tag for the object.
   */
  get [Symbol.toStringTag](): string {
    return 'ProseWriter';
  }
}

/**
 * Creates a new ProseWriter instance with the given content.
 */
export const write = Object.assign(
  (...content: (string | number | boolean | ProseWriter)[]): ProseWriter => {
    return new ProseWriter().write(...content);
  },
  {
    with: (builder: (writer: ProseWriter & InlineUtils) => void): ProseWriter => {
      return new ProseWriter().with(builder);
    },
    unorderedList: (
      ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
    ): ProseWriter => {
      const pw = new ProseWriter();
      if (args.length === 1 && typeof args[0] === 'function') {
        return pw.unorderedList(args[0] as (l: ListBuilder) => void);
      }
      return pw.unorderedList(...(args as (string | number | boolean | ProseWriter)[]));
    },
    list: (
      ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
    ): ProseWriter => {
      const pw = new ProseWriter();
      if (args.length === 1 && typeof args[0] === 'function') {
        return pw.list(args[0] as (l: ListBuilder) => void);
      }
      return pw.list(...(args as (string | number | boolean | ProseWriter)[]));
    },
    orderedList: (
      ...args: [(l: ListBuilder) => void] | (string | number | boolean | ProseWriter)[]
    ): ProseWriter => {
      const pw = new ProseWriter();
      if (args.length === 1 && typeof args[0] === 'function') {
        return pw.orderedList(args[0] as (l: ListBuilder) => void);
      }
      return pw.orderedList(...(args as (string | number | boolean | ProseWriter)[]));
    },
    tasks: (
      ...args:
        | [(l: ListBuilder) => void]
        | (
            | string
            | number
            | boolean
            | ProseWriter
            | [string | number | boolean | ProseWriter, boolean]
          )[]
    ): ProseWriter => {
      const pw = new ProseWriter();
      if (args.length === 1 && typeof args[0] === 'function') {
        return pw.tasks(args[0] as (l: ListBuilder) => void);
      }
      return pw.tasks(
        ...(args as (
          | string
          | number
          | boolean
          | ProseWriter
          | [string | number | boolean | ProseWriter, boolean]
        )[]),
      );
    },
  },
);

/**
 * Appends bold formatting to a string.
 */
export const bold = (content: string | number | boolean | ProseWriter): string =>
  `**${content instanceof ProseWriter ? content.toString().trim() : content}**`;

/**
 * Appends italic formatting to a string.
 */
export const italic = (content: string | number | boolean | ProseWriter): string =>
  `*${content instanceof ProseWriter ? content.toString().trim() : content}*`;

/**
 * Appends inline code formatting to a string.
 */
export const code = (content: string | number | boolean | ProseWriter): string =>
  `\`${content instanceof ProseWriter ? content.toString().trim() : content}\``;

/**
 * Alias for code().
 */
export const inline = code;

/**
 * Appends strikethrough formatting to a string.
 */
export const strike = (content: string | number | boolean | ProseWriter): string =>
  `~~${content instanceof ProseWriter ? content.toString().trim() : content}~~`;

/**
 * Creates a markdown link string.
 */
export const link = (text: string | ProseWriter, url: string): string =>
  `[${text instanceof ProseWriter ? text.toString().trim() : text}](${url})`;

/**
 * Creates a markdown image string.
 */
export const image = (alt: string | ProseWriter, url: string): string =>
  `![${alt instanceof ProseWriter ? alt.toString().trim() : alt}](${url})`;
