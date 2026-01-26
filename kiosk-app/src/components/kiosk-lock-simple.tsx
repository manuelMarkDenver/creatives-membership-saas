'use client';

import { useEffect, useCallback } from 'react';

interface KioskLockSimpleProps {
  children: React.ReactNode;
}

export default function KioskLockSimple({ children }: KioskLockSimpleProps) {
  // Enter fullscreen mode (mobile/tablet compatible)
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    
    // Try different fullscreen methods for cross-browser compatibility
    const requestFullscreen = elem.requestFullscreen || 
                             (elem as any).webkitRequestFullscreen || 
                             (elem as any).mozRequestFullScreen || 
                             (elem as any).msRequestFullscreen;
    
    if (requestFullscreen) {
      requestFullscreen.call(elem).catch(err => {
        console.log(`Fullscreen error: ${err.message}`);
        // Try again after a short delay
        setTimeout(enterFullscreen, 1000);
      });
    }
  }, []);

  // Prevent context menu (right-click) - only in non-debug mode
  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Check if debug mode is enabled via localStorage
    const debugMode = localStorage.getItem('kiosk-debug-mode') === 'true';
    if (!debugMode) {
      e.preventDefault();
      return false;
    }
    return true;
  }, []);

  // Prevent navigation away from page
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = 'Kiosk mode is active. Use a separate device for admin tasks.';
  }, []);

  // Prevent exiting fullscreen (cross-browser compatible)
  const handleFullscreenChange = useCallback(() => {
    const fullscreenElement = document.fullscreenElement || 
                             (document as any).webkitFullscreenElement || 
                             (document as any).mozFullScreenElement || 
                             (document as any).msFullscreenElement;
    
    if (!fullscreenElement) {
      console.log('Fullscreen exited, re-entering...');
      enterFullscreen();
    }
  }, [enterFullscreen]);

  // Prevent ALL keyboard shortcuts - only in non-debug mode
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if debug mode is enabled via localStorage
    const debugMode = localStorage.getItem('kiosk-debug-mode') === 'true';
    
    if (!debugMode) {
      // Block ALL function keys
      if (e.key.startsWith('F') && e.key.length > 1) {
        e.preventDefault();
      }
      
      // Block Escape key (exits fullscreen)
      if (e.key === 'Escape') {
        e.preventDefault();
      }
      
      // Block ALL modifier key combinations
      if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
      }
      
      // Block tab key (navigation)
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    }
  }, []);

  // Mobile/tablet specific: Prevent virtual keyboard
  const preventVirtualKeyboard = useCallback((e: Event) => {
    e.preventDefault();
    // Focus back to hidden input if it exists
    const hiddenInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.focus();
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Enter fullscreen on mount
    enterFullscreen();
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Mobile/tablet: Prevent virtual keyboard triggers
    document.addEventListener('touchstart', preventVirtualKeyboard, { passive: false });
    document.addEventListener('touchend', preventVirtualKeyboard, { passive: false });
    document.addEventListener('touchmove', preventVirtualKeyboard, { passive: false });
    
    // Prevent drag/drop
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
    
    // Prevent text selection
    document.addEventListener('selectstart', (e) => e.preventDefault());
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('touchstart', preventVirtualKeyboard);
      document.removeEventListener('touchend', preventVirtualKeyboard);
      document.removeEventListener('touchmove', preventVirtualKeyboard);
      document.removeEventListener('dragstart', (e) => e.preventDefault());
      document.removeEventListener('drop', (e) => e.preventDefault());
      document.removeEventListener('selectstart', (e) => e.preventDefault());
    };
  }, [enterFullscreen, handleKeyDown, handleContextMenu, handleBeforeUnload, handleFullscreenChange, preventVirtualKeyboard]);

  return (
    <>
      {children}
      
      {/* Simple lock indicator */}
      <div className="fixed top-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-300">
        Kiosk Mode {process.env.NODE_ENV === 'development' ? '(Dev)' : ''}
      </div>
      
      {/* Development mode hint */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 left-2 text-xs text-yellow-400 bg-black bg-opacity-70 px-2 py-1 rounded">
          Dev Mode: Use hardware buttons to exit
        </div>
      )}
    </>
  );
}