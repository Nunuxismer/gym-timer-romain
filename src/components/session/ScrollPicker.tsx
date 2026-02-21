import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  className?: string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

export function ScrollPicker({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  suffix,
  className,
}: ScrollPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Generate values array
  const values: number[] = [];
  for (let v = min; v <= max; v += step) {
    values.push(parseFloat(v.toFixed(2)));
  }

  const currentIndex = values.findIndex(v => v === value);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Scroll to value on mount and when value changes externally
  useEffect(() => {
    if (!containerRef.current || isScrollingRef.current) return;
    const targetScroll = safeIndex * ITEM_HEIGHT;
    containerRef.current.scrollTop = targetScroll;
  }, [safeIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
      
      // Snap to position
      containerRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });

      if (values[clampedIndex] !== value) {
        onChange(values[clampedIndex]);
      }
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }, 80);
  }, [values, value, onChange]);

  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {label && (
        <span className="text-xs text-muted-foreground mb-1 font-medium">{label}</span>
      )}
      <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
        {/* Selection highlight */}
        <div
          className="absolute left-0 right-0 bg-primary/15 border-y border-primary/30 rounded-md pointer-events-none z-10"
          style={{
            top: paddingItems * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
        />
        {/* Fade masks */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-secondary/80 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-secondary/80 to-transparent pointer-events-none z-20" />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Top padding */}
          {Array.from({ length: paddingItems }).map((_, i) => (
            <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
          ))}

          {values.map((v, i) => {
            const isSelected = i === safeIndex;
            return (
              <div
                key={v}
                className={cn(
                  'flex items-center justify-center transition-all duration-150',
                  isSelected
                    ? 'text-foreground font-bold text-xl'
                    : 'text-muted-foreground/50 text-base'
                )}
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: 'start',
                }}
              >
                {step < 1 ? v.toFixed(1) : v}
              </div>
            );
          })}

          {/* Bottom padding */}
          {Array.from({ length: paddingItems }).map((_, i) => (
            <div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
          ))}
        </div>
      </div>
      {suffix && (
        <span className="text-xs text-muted-foreground mt-1 font-medium">{suffix}</span>
      )}
    </div>
  );
}
