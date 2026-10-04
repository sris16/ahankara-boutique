"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

export interface ComboboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  hasError?: boolean;
  emptyMessage?: React.ReactNode;
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  ({ options, value, onValueChange, className, hasError, disabled, placeholder, emptyMessage, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value || "");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listboxRef = React.useRef<HTMLUListElement>(null);

    React.useEffect(() => {
      setInputValue(value || "");
    }, [value]);

    React.useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const filteredOptions = React.useMemo(() => {
      if (!inputValue) return options.slice(0, 50);
      const lowerInput = inputValue.toLowerCase();
      return options
        .filter((o) => o.toLowerCase().includes(lowerInput))
        .slice(0, 10);
    }, [options, inputValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      onValueChange(val);
      setIsOpen(true);
      setHighlightedIndex(-1);
    };

    const handleSelectOption = (option: string) => {
      setInputValue(option);
      onValueChange(option);
      setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) => 
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;
        case "Enter":
          if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            e.preventDefault();
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    React.useEffect(() => {
      if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
        const item = listboxRef.current.children[highlightedIndex] as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: "nearest" });
        }
      }
    }, [highlightedIndex, isOpen]);

    return (
      <div className={cn("relative w-full", className)} ref={containerRef}>
        <div className="relative w-full group">
          <input
            ref={ref}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="combobox-options"
            aria-autocomplete="list"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "flex h-11 sm:h-10 w-full rounded-sm border bg-surface px-3.5 py-2 pr-10 text-base sm:text-sm text-foreground transition-colors duration-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
              hasError
                ? "border-destructive text-destructive focus-visible:ring-destructive"
                : "border-border hover:border-border-strong focus-visible:ring-ring focus-visible:border-primary"
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-muted-foreground group-hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) {
                setIsOpen(!isOpen);
              }
            }}
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-surface border border-border shadow-md rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-fast">
            <ul
              ref={listboxRef}
              id="combobox-options"
              role="listbox"
              className="max-h-60 overflow-y-auto py-1 hide-scrollbar"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3.5 py-3 text-sm text-muted-foreground text-center italic select-none">
                  {emptyMessage || "No matching suggestions"}
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.toLowerCase() === value?.toLowerCase();
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={option}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectOption(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer select-none transition-colors",
                        isHighlighted ? "bg-muted text-foreground" : "text-foreground/80 hover:text-foreground hover:bg-muted/50",
                        isSelected ? "font-medium" : "font-normal"
                      )}
                    >
                      <span className="truncate">{option}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-primary ml-2" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);
Combobox.displayName = "Combobox";
