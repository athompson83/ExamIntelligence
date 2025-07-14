import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EnhancedDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showTime?: boolean;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select date",
  className,
  disabled = false,
  showTime = false,
  required = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
      // Don't use showPicker() due to cross-origin iframe issues
      // The input will handle the picker natively when focused
    }
  };

  const formatDisplayValue = (dateValue: string) => {
    if (!dateValue) return '';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue;
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(showTime && {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateValue;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={cn(
          "relative flex items-center border border-input rounded-md cursor-pointer hover:border-ring focus-within:border-ring transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleContainerClick}
      >
        <Input
          ref={inputRef}
          type={showTime ? "datetime-local" : "date"}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={minDate}
          max={maxDate}
          className="border-0 shadow-none focus-visible:ring-0 pr-10 cursor-pointer"
        />
        
        <div className="absolute right-3 flex items-center pointer-events-none">
          {showTime ? (
            <Clock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Calendar className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Display formatted date below input */}
      {inputValue && (
        <div className="mt-1 text-xs text-muted-foreground">
          {formatDisplayValue(inputValue)}
        </div>
      )}
    </div>
  );
};