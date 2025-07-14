import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkingDatePickerProps {
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

export const WorkingDatePicker: React.FC<WorkingDatePickerProps> = ({
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );
  const [timeValue, setTimeValue] = useState(
    value && showTime ? new Date(value).toTimeString().slice(0, 5) : '09:00'
  );
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date);
      if (showTime) {
        setTimeValue(date.toTimeString().slice(0, 5));
      }
    }
  }, [value, showTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    let finalDate = new Date(date);
    if (showTime) {
      const [hours, minutes] = timeValue.split(':');
      finalDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const isoString = finalDate.toISOString();
    const formattedValue = showTime 
      ? isoString.slice(0, 16) // datetime-local format
      : isoString.slice(0, 10); // date format
    
    setInputValue(formattedValue);
    onChange(formattedValue);
    
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':');
      const finalDate = new Date(selectedDate);
      finalDate.setHours(parseInt(hours), parseInt(minutes));
      
      const formattedValue = finalDate.toISOString().slice(0, 16);
      setInputValue(formattedValue);
      onChange(formattedValue);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
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

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        onClick={handleInputClick}
      >
        <div className="flex-1 px-3 py-2 text-sm">
          {inputValue ? formatDisplayValue(inputValue) : placeholder}
        </div>
        
        <div className="absolute right-3 flex items-center pointer-events-none">
          {showTime ? (
            <Clock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Calendar className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Custom Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 min-w-[280px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="font-semibold text-sm">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-xs text-gray-500 text-center py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="text-center">
                {day ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-xs",
                      selectedDate && day.toDateString() === selectedDate.toDateString()
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-100"
                    )}
                    onClick={() => handleDateSelect(day)}
                  >
                    {day.getDate()}
                  </Button>
                ) : (
                  <div className="h-8 w-8" />
                )}
              </div>
            ))}
          </div>
          
          {/* Time Picker */}
          {showTime && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          )}
          
          {/* Done Button */}
          <div className="mt-3 pt-3 border-t">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};