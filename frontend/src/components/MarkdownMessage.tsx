/**
 * Lightweight markdown renderer for AI chat bubbles.
 * Supports: **bold**, *italic*, numbered lists, bullet lists, inline code, line breaks.
 * No external dependency needed.
 */
import React from 'react';

interface Props {
  text: string;
  className?: string;
}

// Parse a single inline string: **bold**, *italic*, `code`
function parseInline(str: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex: **bold** | *italic* | `code`
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(str)) !== null) {
    // Text before match
    if (match.index > last) {
      parts.push(str.slice(last, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={key++} className="font-bold">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={key++} className="bg-slate-200 dark:bg-slate-600 px-1 py-0.5 rounded text-xs font-mono">
          {match[3]}
        </code>
      );
    }
    last = regex.lastIndex;
  }

  if (last < str.length) parts.push(str.slice(last));
  return parts;
}

const MarkdownMessage: React.FC<Props> = ({ text, className = '' }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list: "1. text" or "1) text"
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const lm = lines[i].match(/^(\d+)[.)]\s+(.+)/);
        if (!lm) break;
        listItems.push(
          <li key={i} className="ml-1">{parseInline(lm[2])}</li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-1">
          {listItems}
        </ol>
      );
      continue;
    }

    // Bullet list: "- text" or "* text"
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length) {
        const bm = lines[i].match(/^[-*]\s+(.+)/);
        if (!bm) break;
        listItems.push(
          <li key={i} className="ml-1">{parseInline(bm[1])}</li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-1">
          {listItems}
        </ul>
      );
      continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Heading: ### or ##
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1 ? 'text-base font-black' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold';
      elements.push(
        <p key={`h-${i}`} className={`${cls} mt-2 mb-1`}>{parseInline(headingMatch[2])}</p>
      );
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed">{parseInline(line)}</p>
    );
    i++;
  }

  return <div className={`text-sm space-y-0.5 ${className}`}>{elements}</div>;
};

export default MarkdownMessage;
