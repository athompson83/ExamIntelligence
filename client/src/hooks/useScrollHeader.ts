import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
  headerHeight?: number; // Height of the header element (default 64px)
  scrollSensitivity?: number; // Minimum scroll difference to detect direction (default 5px)
}

interface UseScrollHeaderReturn {
  isFixed: boolean; // Whether header should be fixed positioned
  isScrollingUp: boolean; // Whether user is scrolling up
  isAtTop: boolean; // Whether at top of page
  scrollY: number;
  headerHeight: number;
  headerOutOfView: boolean; // Whether the sticky header has scrolled out of view
}

export function useScrollHeader(options: UseScrollHeaderOptions = {}): UseScrollHeaderReturn {
  const {
    headerHeight = 64,
    scrollSensitivity = 5
  } = options;

  const [isFixed, setIsFixed] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [headerOutOfView, setHeaderOutOfView] = useState(false);
  
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
          
          // Check if header would be out of view (scrolled past header height)
          const outOfView = currentScrollY > headerHeight;
          setHeaderOutOfView(outOfView);
          
          // Determine scroll direction
          const scrollDelta = currentScrollY - lastScrollY.current;
          const scrollingUp = scrollDelta < -scrollSensitivity;
          const scrollingDown = scrollDelta > scrollSensitivity;
          
          setIsScrollingUp(scrollingUp);
          
          // Header positioning logic:
          // 1. At top of page: sticky (isFixed = false)
          // 2. Scrolling down: let it scroll away naturally (isFixed = false)
          // 3. Scrolling up when header is out of view: show as fixed (isFixed = true)
          // 4. When back at top: return to sticky (isFixed = false)
          
          if (atTop) {
            // At top - use sticky positioning
            setIsFixed(false);
          } else if (scrollingUp && outOfView) {
            // Scrolling up and header is out of view - show as fixed
            setIsFixed(true);
          } else if (scrollingDown) {
            // Scrolling down - let header scroll away
            setIsFixed(false);
          }
          // Keep current state for small movements
          
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
  }, [headerHeight, scrollSensitivity]);

  return {
    isFixed,
    isScrollingUp,
    isAtTop,
    scrollY,
    headerHeight,
    headerOutOfView
  };
}