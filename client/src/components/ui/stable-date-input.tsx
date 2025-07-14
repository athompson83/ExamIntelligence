import { forwardRef, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StableDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
  preventClear?: boolean;
}

export const StableDateInput = forwardRef<HTMLInputElement, StableDateInputProps>(
  ({ className, onValueChange, onChange, preventClear = true, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(props.defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Use forwarded ref or internal ref
    const resolvedRef = ref || inputRef;

    useEffect(() => {
      if (props.defaultValue !== undefined) {
        setInternalValue(props.defaultValue);
      }
    }, [props.defaultValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      e.stopPropagation();
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const value = e.target.value;
      
      // Only update if value actually changed
      if (value !== internalValue) {
        setInternalValue(value);
        onValueChange?.(value);
      }
      
      props.onBlur?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
      props.onClick?.(e);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
      props.onMouseDown?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      props.onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (preventClear && isFocused) {
        // During focus, store the value but don't trigger external updates
        setInternalValue(e.target.value);
      } else {
        // Normal change handling when not focused
        setInternalValue(e.target.value);
        onValueChange?.(e.target.value);
      }
      
      onChange?.(e);
    };

    return (
      <Input
        ref={resolvedRef}
        className={cn(className)}
        value={isFocused ? internalValue : (props.defaultValue || internalValue)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          zIndex: 10,
          ...props.style
        }}
        {...props}
      />
    );
  }
);

StableDateInput.displayName = "StableDateInput";