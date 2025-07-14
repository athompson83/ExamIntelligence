import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MultiSelectOption {
  id: string;
  label: string;
  value: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxDisplay?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onSelectionChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  searchable = true,
  maxDisplay = 3
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionId: string) => {
    if (selected.includes(optionId)) {
      onSelectionChange(selected.filter(id => id !== optionId));
    } else {
      onSelectionChange([...selected, optionId]);
    }
  };

  const removeOption = (optionId: string) => {
    onSelectionChange(selected.filter(id => id !== optionId));
  };

  const selectedOptions = options.filter(option => selected.includes(option.id));
  const displayText = selectedOptions.length === 0 
    ? placeholder 
    : selectedOptions.length <= maxDisplay
      ? selectedOptions.map(opt => opt.label).join(', ')
      : `${selectedOptions.slice(0, maxDisplay).map(opt => opt.label).join(', ')} +${selectedOptions.length - maxDisplay} more`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between text-left font-normal",
          selectedOptions.length === 0 && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {searchable && (
            <div className="p-2 border-b">
              <Input
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selected.includes(option.id) && "bg-accent"
                  )}
                  onClick={() => toggleOption(option.id)}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selected.includes(option.id) 
                        ? "bg-primary text-primary-foreground" 
                        : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected items display */}
      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
            >
              <span>{option.label}</span>
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};