
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * A simplified markdown-to-JSX renderer focusing on common structures:
 * - Paragraphs
 * - Lists (bulleted)
 * - Code blocks (fenced)
 * - Bold/Italic
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split into blocks (paragraphs, lists, code)
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentCodeBlock: string[] | null = null;
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc ml-6 my-2 space-y-1">
          {listItems.map((item, idx) => <li key={idx} className="text-slate-200">{renderInline(item)}</li>)}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string) => {
    // Basic bold/italic/code-span
    let parts: (string | React.ReactNode)[] = [text];

    // Bold **text**
    parts = parts.flatMap(p => typeof p !== 'string' ? p : p.split(/(\*\*.*?\*\*)/g).map(s => {
      if (s.startsWith('**') && s.endsWith('**')) {
        return <strong key={s} className="font-bold text-white">{s.slice(2, -2)}</strong>;
      }
      return s;
    }));

    // Inline code `text`
    parts = parts.flatMap(p => typeof p !== 'string' ? p : p.split(/(`.*?`)/g).map(s => {
      if (s.startsWith('`') && s.endsWith('`')) {
        return <code key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 font-mono text-sm">{s.slice(1, -1)}</code>;
      }
      return s;
    }));

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (currentCodeBlock === null) {
        currentCodeBlock = [];
      } else {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-slate-900 border border-slate-700 p-4 rounded-lg my-3 overflow-x-auto text-sm font-mono text-slate-300">
            <code>{currentCodeBlock.join('\n')}</code>
          </pre>
        );
        currentCodeBlock = null;
      }
      continue;
    }

    if (currentCodeBlock !== null) {
      currentCodeBlock.push(line);
      continue;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      inList = true;
      listItems.push(line.trim().substring(2));
      continue;
    } else {
      flushList();
    }

    // Paragraphs
    if (line.trim() === '') {
      continue;
    }

    elements.push(
      <p key={`p-${elements.length}`} className="mb-3 leading-relaxed text-slate-200">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className="prose prose-invert max-w-none">{elements}</div>;
};
