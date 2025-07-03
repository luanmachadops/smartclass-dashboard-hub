import { useEffect, useRef, useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  enabled?: boolean;
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'both';
  selector?: string;
}

export const useKeyboardNavigation = ({
  enabled = true,
  loop = true,
  orientation = 'both',
  selector = '[role="button"], button, [tabindex="0"], a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
}: UseKeyboardNavigationOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const currentFocusIndex = useRef<number>(0);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const elements = containerRef.current.querySelectorAll(selector);
    return Array.from(elements).filter((element) => {
      const htmlElement = element as HTMLElement;
      return (
        htmlElement.offsetParent !== null &&
        !htmlElement.hasAttribute('disabled') &&
        htmlElement.getAttribute('aria-hidden') !== 'true'
      );
    }) as HTMLElement[];
  }, [selector]);

  const focusElement = useCallback((index: number) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    let targetIndex = index;
    
    if (loop) {
      if (targetIndex < 0) {
        targetIndex = elements.length - 1;
      } else if (targetIndex >= elements.length) {
        targetIndex = 0;
      }
    } else {
      targetIndex = Math.max(0, Math.min(targetIndex, elements.length - 1));
    }

    currentFocusIndex.current = targetIndex;
    elements[targetIndex]?.focus();
  }, [getFocusableElements, loop]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = elements.indexOf(currentElement);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    let handled = false;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex = currentIndex + 1;
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex = currentIndex - 1;
          handled = true;
        }
        break;
      case 'Home':
        nextIndex = 0;
        handled = true;
        break;
      case 'End':
        nextIndex = elements.length - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        // Trigger click on current element
        if (currentElement && (currentElement.tagName === 'BUTTON' || currentElement.getAttribute('role') === 'button')) {
          event.preventDefault();
          currentElement.click();
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      if (nextIndex !== currentIndex) {
        focusElement(nextIndex);
      }
    }
  }, [enabled, getFocusableElements, orientation, focusElement]);

  const focusFirst = useCallback(() => {
    focusElement(0);
  }, [focusElement]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    focusElement(elements.length - 1);
  }, [focusElement, getFocusableElements]);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = elements.indexOf(currentElement);
    focusElement(currentIndex + 1);
  }, [focusElement, getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = elements.indexOf(currentElement);
    focusElement(currentIndex - 1);
  }, [focusElement, getFocusableElements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements
  };
};

export default useKeyboardNavigation;