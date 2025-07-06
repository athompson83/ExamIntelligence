import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Image,
  Link,
  Code,
  Quote
} from 'lucide-react';

// Memoized toolbar button component for better performance
const ToolbarButton = memo(({ 
  icon: Icon, 
  onClick, 
  title, 
  compact = false 
}: { 
  icon: any; 
  onClick: () => void; 
  title: string; 
  compact?: boolean;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={title}
    className={`p-0 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
    aria-label={title}
  >
    <Icon className={`${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
  </Button>
));

ToolbarButton.displayName = 'ToolbarButton';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowMedia?: boolean;
  compact?: boolean;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text...", 
  className = "",
  allowMedia = true,
  compact = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    try {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.warn('Editor command failed:', command, error);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertImage = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url && url.trim()) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  // Memoized toolbar buttons for better performance
  const toolbarButtons = useMemo(() => {
    const baseButtons = [
      { icon: Bold, command: 'bold', title: 'Bold' },
      { icon: Italic, command: 'italic', title: 'Italic' },
      { icon: Underline, command: 'underline', title: 'Underline' },
      { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
      { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
    ];

    if (!compact) {
      baseButtons.push(
        { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
        { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
        { icon: Code, command: 'code', title: 'Code' },
        { icon: Quote, command: 'blockquote', title: 'Quote' }
      );
    }

    return baseButtons;
  }, [compact]);



  return (
    <div className={`border rounded-md ${className}`}>
      {/* Toolbar */}
      <div className={`border-b p-2 flex flex-wrap gap-1 ${compact ? 'py-1' : ''}`}>
        {toolbarButtons.map((btn, index) => (
          <ToolbarButton
            key={index}
            icon={btn.icon}
            onClick={() => execCommand(btn.command)}
            title={btn.title}
            compact={compact}
          />
        ))}
        
        {allowMedia && (
          <>
            <div className="border-l mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertLink}
              title="Insert Link"
              className="h-8 w-8 p-0"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertImage}
              title="Insert Image"
              className="h-8 w-8 p-0"
            >
              <Image className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        className={`
          min-h-[120px] p-3 outline-none 
          ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}
          prose prose-sm max-w-none
          focus:outline-none
        `}
        style={{
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        data-placeholder={!value ? placeholder : ''}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}