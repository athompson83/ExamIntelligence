import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
  scrollThreshold?: number;  // Minimum scroll distance before hiding (default 100px)
  scrollSensitivity?: number; // Minimum scroll difference to detect direction (default 5px)
}

interface UseScrollHeaderReturn {
  isVisible: boolean;
  isAtTop: boolean;
  scrollY: number;
  headerHeight: number;
}

export function useScrollHeader(options: UseScrollHeaderOptions = {}): UseScrollHeaderReturn {
  const {
    scrollThreshold = 100,
    scrollSensitivity = 5
  } = options;

  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [headerHeight] = useState(64); // Standard header height
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Update scroll position
          setScrollY(currentScrollY);
          
          // Check if at top of page
          const atTop = currentScrollY < 10;
          setIsAtTop(atTop);
          
          // Always show header when at top or near top
          if (atTop || currentScrollY < scrollThreshold) {
            setIsVisible(true);
          } else {
            // Determine scroll direction
            const scrollDelta = currentScrollY - lastScrollY.current;
            
            // Hide when scrolling down (positive delta)
            if (scrollDelta > scrollSensitivity) {
              setIsVisible(false);
            }
            // Show when scrolling up (negative delta)
            else if (scrollDelta < -scrollSensitivity) {
              setIsVisible(true);
            }
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold, scrollSensitivity]);

  return {
    isVisible,
    isAtTop,
    scrollY,
    headerHeight
  };
}