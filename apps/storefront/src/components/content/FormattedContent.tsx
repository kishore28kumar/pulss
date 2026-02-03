'use client';

interface FormattedContentProps {
  text: string;
}

export default function FormattedContent({ text }: FormattedContentProps) {
  // Helper to check if a line is a separator (mostly dashes or special characters)
  const isSeparator = (line: string): boolean => {
    const trimmed = line.trim();
    if (trimmed.length < 3) return false;
    // Check if line is mostly dashes, underscores, or similar characters
    // Support various separator characters: ━ (box drawing), ─ (em dash), - (hyphen), _ (underscore), = (equals)
    const specialChars = trimmed.match(/[━─\-_=]/g);
    return !!(specialChars && specialChars.length / trimmed.length > 0.6);
  };

  // Helper to check if a line is a header (starts with #)
  const isHeader = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('# ') && trimmed.length > 3;
  };

  // Helper to check if a line is a sub-header (starts with ##)
  const isSubHeaderByMarkdown = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('## ') && trimmed.length > 4;
  };

  // Helper to check if a line is a bullet point
  const isBullet = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
  };

  // Helper to check if a line is a sub-header (ends with colon or starts with ##)
  const isSubHeader = (line: string, nextLine: string | null): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return false;
    
    // Check markdown-style sub-header first
    if (isSubHeaderByMarkdown(trimmed)) {
      return true;
    }
    
    // Check if line ends with colon and next line exists
    if (trimmed.endsWith(':') && nextLine && nextLine.trim()) {
      return true;
    }
    // Check if it's a short line followed by a longer line (likely a label)
    if (trimmed.length < 50 && nextLine && nextLine.trim().length > trimmed.length) {
      const hasColon = trimmed.includes(':');
      return hasColon || (trimmed.split(' ').length <= 5);
    }
    return false;
  };

  // Parse the text into structured elements
  const parseText = (text: string) => {
    const lines = text.split('\n');
    const elements: Array<{
      type: 'separator' | 'header' | 'subheader' | 'bullet' | 'paragraph';
      content: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1]?.trim() : null;
      const prevElement = elements.length > 0 ? elements[elements.length - 1] : null;

      // Skip empty lines
      if (!trimmed) {
        continue;
      }

      if (isSeparator(line)) {
        // Don't add consecutive separators
        if (prevElement?.type !== 'separator') {
          elements.push({ type: 'separator', content: '' });
        }
      } else if (isHeader(trimmed)) {
        // Remove # prefix and trim
        const headerContent = trimmed.replace(/^#+\s*/, '').trim();
        elements.push({ type: 'header', content: headerContent });
      } else if (isSubHeader(trimmed, nextLine)) {
        // Remove ## prefix if present, or keep as is for colon-based sub-headers
        const subHeaderContent = trimmed.startsWith('##') 
          ? trimmed.replace(/^##+\s*/, '').trim()
          : trimmed;
        elements.push({ type: 'subheader', content: subHeaderContent });
      } else if (isBullet(trimmed)) {
        elements.push({ type: 'bullet', content: trimmed });
      } else {
        elements.push({ type: 'paragraph', content: trimmed });
      }
    }

    return elements;
  };

  const elements = parseText(text);

  return (
    <div className="space-y-4">
      {elements.map((element, index) => {
        const prevElement = index > 0 ? elements[index - 1] : null;
        const nextElement = index < elements.length - 1 ? elements[index + 1] : null;
        const isFirstElement = index === 0;

        switch (element.type) {
          case 'separator':
            return (
              <div
                key={index}
                className="border-t border-gray-200 my-6"
                aria-hidden="true"
              />
            );

          case 'header':
            return (
              <h2
                key={index}
                className={`text-2xl font-bold text-gray-900 mb-4 ${isFirstElement ? 'mt-0' : 'mt-8'}`}
              >
                {element.content}
              </h2>
            );

          case 'subheader':
            return (
              <h3
                key={index}
                className="text-lg font-semibold text-gray-900 mt-6 mb-2"
              >
                {element.content}
              </h3>
            );

          case 'bullet':
            const bulletContent = element.content.replace(/^[•\-\*]\s*/, '');
            const isInBulletList = prevElement?.type === 'bullet' || nextElement?.type === 'bullet';
            return (
              <div 
                key={index} 
                className={`flex items-start gap-3 ${isInBulletList && prevElement?.type !== 'bullet' ? 'mt-2' : ''} ${isInBulletList ? 'ml-4' : 'ml-4'}`}
              >
                <span className="text-gray-600 mt-1 flex-shrink-0">•</span>
                <p className="text-gray-700 flex-1 leading-relaxed break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {bulletContent}
                </p>
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p 
                key={index} 
                className="text-gray-700 leading-relaxed break-words" 
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                {element.content}
              </p>
            );
        }
      })}
    </div>
  );
}

