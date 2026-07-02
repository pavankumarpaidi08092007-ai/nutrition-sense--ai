import React from 'react';

const formatInline = (str: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={match.index} className="chatbot-md-code">{match[4]}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.slice(lastIndex));
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
};

export const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let listItems: React.ReactNode[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${elements.length}`} className="chatbot-md-ol">{listItems}</ol>);
      } else {
        elements.push(<ul key={`ul-${elements.length}`} className="chatbot-md-ul">{listItems}</ul>);
      }
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);
      elements.push(
        <div key={`tbl-${elements.length}`} className="chatbot-md-table-wrap">
          <table className="chatbot-md-table">
            <thead>
              <tr>{headerRow.map((cell, i) => <th key={i}>{formatInline(cell)}</th>)}</tr>
            </thead>
            {bodyRows.length > 0 && (
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{formatInline(cell)}</td>)}</tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      flushList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith('|') || (trimmed.includes('|') && trimmed.split('|').length >= 3)) {
      flushList();
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
      if (cells.every(c => /^[-:]+$/.test(c))) {
        if (!inTable) inTable = true;
        continue;
      }
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={`h-${i}`} className="chatbot-md-h2">{formatInline(trimmed.slice(3))}</h3>);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={`h-${i}`} className="chatbot-md-h1">{formatInline(trimmed.slice(2))}</h2>);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`bq-${i}`} className="chatbot-md-blockquote">
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(<li key={`li-${i}`}>{formatInline(olMatch[2])}</li>);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(<li key={`li-${i}`}>{formatInline(trimmed.slice(2))}</li>);
      continue;
    }

    flushList();
    elements.push(<p key={`p-${i}`} className="chatbot-md-p">{formatInline(trimmed)}</p>);
  }

  flushList();
  flushTable();

  return <div className="chatbot-md-root">{elements}</div>;
};
