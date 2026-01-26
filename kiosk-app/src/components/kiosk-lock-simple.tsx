'use client';

import { useEffect, useCallback } from 'react';

interface KioskLockSimpleProps {
  children: React.ReactNode;
}

export default function KioskLockSimple({ children }: KioskLockSimpleProps) {
  // Enter fullscreen mode
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log(`Fullscreen error: ${err.message}`);
      });
    }
  }, []);

  // Prevent context menu (right-click)
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Prevent navigation away from page
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = 'Kiosk mode is active. Use a separate device for admin tasks.';
  }, []);

  // Prevent exiting fullscreen
  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement) {
      enterFullscreen();
    }
  }, [enterFullscreen]);

  // Prevent ALL keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
    
    // Prevent drag/drop
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('dragstart', (e) => e.preventDefault());
      document.removeEventListener('drop', (e) => e.preventDefault());
    };
  }, [enterFullscreen, handleKeyDown, handleContextMenu, handleBeforeUnload, handleFullscreenChange]);

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
      
      {/* Block all interactions except card input */}
      <div 
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
}