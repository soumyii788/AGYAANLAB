import React from 'react';
import clsx from 'clsx';

/**
 * Strips all markdown asterisks (*) and hashtags (#) while preserving
 * semantic formatting (bold, italic, headings, bullet lists, checkboxes, and tables).
 */
export const renderCleanInline = (text) => {
  if (!text) return null;

  // Split on bold-italic (***), bold (**), or italic (*)
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('***') && part.endsWith('***')) {
      const clean = part.slice(3, -3).replace(/[*#]/g, '');
      return (
        <strong key={index} className="font-bold text-[#202124] dark:text-white">
          <em className="italic">{clean}</em>
        </strong>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const clean = part.slice(2, -2).replace(/[*#]/g, '');
      return (
        <strong key={index} className="font-bold text-[#202124] dark:text-white">
          {clean}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      const clean = part.slice(1, -1).replace(/[*#]/g, '');
      return (
        <em key={index} className="italic text-gray-700 dark:text-gray-300">
          {clean}
        </em>
      );
    }

    // Regular text: strip any stray '*' or '#' characters completely
    const clean = part.replace(/[*#]/g, '');
    return <React.Fragment key={index}>{clean}</React.Fragment>;
  });
};

export const CleanMarkdown = ({ content, className = '' }) => {
  if (!content) return null;

  const rawLines = content.split('\n');
  const elements = [];
  let tableBuffer = [];

  const flushTable = (keyPrefix) => {
    if (tableBuffer.length === 0) return;

    // Filter out divider lines like | :--- | :--- |
    const validRows = tableBuffer.filter((row) => !/^\|?[\s:-|]+\|?$/.test(row));
    if (validRows.length > 0) {
      const headerRow = validRows[0];
      const bodyRows = validRows.slice(1);

      const headerCells = headerRow
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      elements.push(
        <div key={`${keyPrefix}-table`} className="overflow-x-auto my-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-xs text-left divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/60 font-bold text-[#202124] dark:text-white">
              <tr>
                {headerCells.map((cell, idx) => (
                  <th key={idx} className="px-3.5 py-2.5">
                    {renderCleanInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/50">
              {bodyRows.map((row, rIdx) => {
                const cells = row
                  .split('|')
                  .slice(1, -1)
                  .map((c) => c.trim());
                return (
                  <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-gray-800 dark:text-gray-200">
                        {renderCleanInline(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Check if line is part of a markdown table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableBuffer.push(trimmed);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable(`tbl-${i}`);
    }

    // Empty line spacer
    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-4 border-gray-200 dark:border-gray-800" />
      );
      continue;
    }

    // Headings with # hashtags
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];

      if (level === 1) {
        elements.push(
          <h2 key={`h-${i}`} className="text-lg font-black text-[#202124] dark:text-white tracking-tight mt-4 mb-2 pb-1 border-b border-gray-200 dark:border-gray-800">
            {renderCleanInline(text)}
          </h2>
        );
      } else if (level === 2) {
        elements.push(
          <h3 key={`h-${i}`} className="text-base font-extrabold text-[#202124] dark:text-white tracking-tight mt-4 mb-2">
            {renderCleanInline(text)}
          </h3>
        );
      } else if (level === 3) {
        elements.push(
          <h4 key={`h-${i}`} className="text-sm font-bold text-[#202124] dark:text-white tracking-tight mt-3 mb-1">
            {renderCleanInline(text)}
          </h4>
        );
      } else {
        elements.push(
          <h5 key={`h-${i}`} className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mt-2 mb-1">
            {renderCleanInline(text)}
          </h5>
        );
      }
      continue;
    }

    // Checkbox items (- [ ] or - [x])
    const checkboxMatch = line.match(/^\s*-\s*\[([ xX])\]\s+(.*)$/);
    if (checkboxMatch) {
      const isChecked = checkboxMatch[1].toLowerCase() === 'x';
      const itemText = checkboxMatch[2];
      elements.push(
        <div key={`chk-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 pointer-events-none"
          />
          <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {renderCleanInline(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // Bullet points (* item, - item, + item)
    const bulletMatch = line.match(/^\s*[*+-]\s+(.*)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="text-blue-600 font-bold leading-5 select-none">•</span>
          <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {renderCleanInline(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // Numbered list items (1. item)
    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const itemText = numMatch[2];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-blue-600 font-semibold text-xs leading-5 min-w-[1.25rem] select-none">
            {num}.
          </span>
          <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {renderCleanInline(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // Regular line / paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed my-1">
        {renderCleanInline(line)}
      </p>
    );
  }

  // Flush any remaining table at the end of the document
  if (tableBuffer.length > 0) {
    flushTable('tbl-end');
  }

  return <div className={clsx('font-sans space-y-1', className)}>{elements}</div>;
};

export default CleanMarkdown;
