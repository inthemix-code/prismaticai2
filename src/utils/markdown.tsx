import { ReactNode } from 'react';

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string };

function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end !== -1) {
        tokens.push({ type: 'code', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (input[i] === '*' && input[i + 1] === '*') {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'bold', value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (input[i] === '*') {
      const end = input.indexOf('*', i + 1);
      if (end !== -1) {
        tokens.push({ type: 'italic', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (input[i] === '[') {
      const closeBracket = input.indexOf(']', i + 1);
      if (closeBracket !== -1 && input[closeBracket + 1] === '(') {
        const closeParen = input.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          tokens.push({
            type: 'link',
            value: input.slice(i + 1, closeBracket),
            href: input.slice(closeBracket + 2, closeParen),
          });
          i = closeParen + 1;
          continue;
        }
      }
    }
    const nextSpecial = findNextSpecial(input, i);
    tokens.push({ type: 'text', value: input.slice(i, nextSpecial) });
    i = nextSpecial;
  }
  return tokens;
}

function findNextSpecial(s: string, start: number): number {
  for (let j = start + 1; j < s.length; j++) {
    const c = s[j];
    if (c === '`' || c === '*' || c === '[') return j;
  }
  return s.length;
}

function renderInline(input: string, keyPrefix: string): ReactNode[] {
  const tokens = tokenizeInline(input);
  return tokens.map((t, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (t.type) {
      case 'bold':
        return (
          <strong key={key} className="font-semibold text-white tracking-tight">
            {t.value}
          </strong>
        );
      case 'italic':
        return (
          <em key={key} className="italic text-gray-200">
            {t.value}
          </em>
        );
      case 'code':
        return (
          <code
            key={key}
            className="rounded bg-gray-800/80 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-300 border border-gray-700/60"
          >
            {t.value}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/40 underline-offset-2"
          >
            {t.value}
          </a>
        );
      default:
        return <span key={key}>{t.value}</span>;
    }
  });
}

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className = '' }: MarkdownProps) {
  const lines = children.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const fenceEnd = lines.findIndex((l, idx) => idx > i && l.startsWith('```'));
      const end = fenceEnd === -1 ? lines.length : fenceEnd;
      const code = lines.slice(i + 1, end).join('\n');
      blocks.push(
        <pre
          key={`code-${keyCounter++}`}
          className="my-3 overflow-x-auto rounded-lg border border-gray-700/60 bg-gray-900/80 p-3 font-mono text-xs leading-relaxed text-gray-200"
        >
          <code>{code}</code>
        </pre>
      );
      i = end + 1;
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const sizeClass =
        level === 1
          ? 'text-xl sm:text-2xl font-semibold mt-5 mb-3 leading-[1.2]'
          : level === 2
          ? 'text-lg sm:text-xl font-semibold mt-5 mb-2.5 leading-[1.25]'
          : level === 3
          ? 'text-base sm:text-lg font-semibold mt-4 mb-2 leading-[1.3]'
          : 'text-sm sm:text-base font-semibold mt-3 mb-1.5 leading-[1.3]';
      blocks.push(
        <div
          key={`h-${keyCounter++}`}
          className={`text-white tracking-tight ${sizeClass}`}
        >
          {renderInline(text, `h${keyCounter}`)}
        </div>
      );
      i++;
      continue;
    }

    if (/^\s*>\s+/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s+/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s+/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={`q-${keyCounter++}`}
          className="my-3 border-l-2 border-cyan-500/50 pl-4 text-gray-400 italic"
        >
          {renderInline(quoteLines.join(' '), `q${keyCounter}`)}
        </blockquote>
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul
          key={`ul-${keyCounter++}`}
          className="my-3 space-y-2 ml-1"
        >
          {items.map((it, idx) => (
            <li
              key={`li-${idx}`}
              className="flex gap-3 text-gray-100 leading-[1.7]"
            >
              <span className="mt-[10px] h-[5px] w-[5px] rounded-full bg-cyan-400 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <span className="flex-1">{renderInline(it, `li${keyCounter}-${idx}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol
          key={`ol-${keyCounter++}`}
          className="my-3 space-y-2.5 ml-1 counter-reset-list"
        >
          {items.map((it, idx) => (
            <li
              key={`oli-${idx}`}
              className="flex gap-3 text-gray-100 leading-[1.7]"
            >
              <span className="font-semibold text-[0.85em] text-cyan-300 mt-[3px] min-w-[1.5rem] tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">{renderInline(it, `oli${keyCounter}-${idx}`)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    const isLead = blocks.length === 0;
    blocks.push(
      <p
        key={`p-${keyCounter++}`}
        className={
          isLead
            ? 'text-white/95 leading-[1.7] my-0 text-[1.05em] font-normal'
            : 'text-gray-100 leading-[1.75] my-3 first:mt-0'
        }
      >
        {renderInline(paragraphLines.join(' '), `p${keyCounter}`)}
      </p>
    );
  }

  return <div className={className}>{blocks}</div>;
}
