'use client';

import { useEffect, useCallback, useState } from 'react';

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

  // EXTREME: Prevent navigation away from page
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '⚠️ KIOSK LOCKED: This device is for card tapping only!';
    
    // Play LOUD warning sound only in production (100% volume for noisy gym)
    if (process.env.NODE_ENV === 'production') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Higher pitch
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime); // 100% VOLUME
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4); // Longer for exit attempt
      } catch (e) {
        // Audio not supported
      }
    }
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
    // Only prevent virtual keyboard in kiosk mode, not admin mode
    const debugMode = localStorage.getItem('kiosk-debug-mode') === 'true';
    const isAdminMode = document.querySelector('[data-admin-mode="true"]') !== null;
    
    if (!debugMode && !isAdminMode) {
      e.preventDefault();
      // Focus back to hidden input if it exists
      const hiddenInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (hiddenInput) {
        hiddenInput.focus();
      }
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
    
    // AGGRESSIVE: Try to prevent ALL system gestures
    const preventSystemGestures = (e: TouchEvent) => {
      // Block ALL multi-touch gestures (pinch, zoom, etc.)
      if (e.touches.length > 1) {
        e.preventDefault();
        return;
      }
      
      // Block long presses (context menu, text selection)
      if (e.type === 'touchstart') {
        // Set a timer to detect long press
        const touchStartTime = Date.now();
        const longPressTimer = setTimeout(() => {
          // If still touching after 500ms, vibrate (if supported) and refocus
          if (navigator.vibrate) {
            navigator.vibrate(50); // Short vibration
          }
          enterFullscreen(); // Force back to fullscreen
        }, 500);
        
        // Store timer to clear on touchend
        (e.target as any)._longPressTimer = longPressTimer;
      }
      
      if (e.type === 'touchend' || e.type === 'touchcancel') {
        // Clear long press timer
        const target = e.target as any;
        if (target._longPressTimer) {
          clearTimeout(target._longPressTimer);
          delete target._longPressTimer;
        }
      }
      
      // Detect ANY edge touches (top, bottom, sides)
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const edgeThreshold = 30; // Very aggressive - 30px from edges
        
        // Check ALL edges
        const isNearEdge = 
          touch.clientX < edgeThreshold || 
          touch.clientX > window.innerWidth - edgeThreshold ||
          touch.clientY < edgeThreshold || 
          touch.clientY > window.innerHeight - edgeThreshold;
        
        if (isNearEdge) {
          e.preventDefault();
          // Immediate refocus to hidden input
          const hiddenInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (hiddenInput) {
            hiddenInput.focus();
          }
          return;
        }
      }
    };
    
    // Add aggressive gesture prevention
    document.addEventListener('touchstart', preventSystemGestures, { passive: false });
    document.addEventListener('touchmove', preventSystemGestures, { passive: false });
    document.addEventListener('touchend', preventSystemGestures, { passive: false });
    document.addEventListener('touchcancel', preventSystemGestures, { passive: false });
    
    // EXTREME: Re-enter fullscreen IMMEDIATELY if exited
    const checkAndReenterFullscreen = () => {
      const fullscreenElement = document.fullscreenElement || 
                               (document as any).webkitFullscreenElement || 
                               (document as any).mozFullScreenElement || 
                               (document as any).msFullscreenElement;
      
      if (!fullscreenElement) {
        console.log('🚨 FULLSCREEN EXITED - IMMEDIATE RECOVERY');
        
        // IMMEDIATE re-entry with multiple attempts (FIRST, before sound)
        enterFullscreen();
        setTimeout(enterFullscreen, 50);
        setTimeout(enterFullscreen, 150);
        
        // Play LOUD warning sound only in PRODUCTION (100% volume for noisy gym)
        if (process.env.NODE_ENV === 'production') {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher pitch
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime); // 100% VOLUME
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15); // Slightly longer
          } catch (e) {
            // Audio not supported, continue
          }
        }
      }
    };
    
    // EXTREME: Check VERY frequently (250ms)
    const fullscreenCheckInterval = setInterval(checkAndReenterFullscreen, 250);
    
    // NUCLEAR OPTION: URL hijacking prevention
    const preventURLChange = () => {
      const currentUrl = window.location.href;
      const allowedUrls = [
        window.location.origin + '/', // Main kiosk
        window.location.origin + '/setup', // Setup page
        // Add any other allowed URLs
      ];
      
      if (!allowedUrls.some(url => currentUrl.startsWith(url))) {
        console.log('🚨 UNAUTHORIZED URL DETECTED:', currentUrl);
        // IMMEDIATE REDIRECT BACK
        window.location.href = '/';
        
        // Play LOUD warning sound only in production (100% volume for noisy gym)
        if (process.env.NODE_ENV === 'production') {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime); // Medium pitch
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime); // 100% VOLUME
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.25); // Noticeable length
          } catch (e) {
            // Audio not supported
          }
        }
      }
    };
    
    // Check URL every 100ms
    const urlCheckInterval = setInterval(preventURLChange, 100);
    
    // Also check on hashchange/popstate
    window.addEventListener('hashchange', preventURLChange);
    window.addEventListener('popstate', preventURLChange);
    
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
      document.removeEventListener('touchstart', preventSystemGestures);
      document.removeEventListener('touchmove', preventSystemGestures);
      document.removeEventListener('touchend', preventSystemGestures);
      document.removeEventListener('touchcancel', preventSystemGestures);
      clearInterval(fullscreenCheckInterval);
      clearInterval(urlCheckInterval);
      window.removeEventListener('hashchange', preventURLChange);
      window.removeEventListener('popstate', preventURLChange);
    };
  }, [enterFullscreen, handleKeyDown, handleContextMenu, handleBeforeUnload, handleFullscreenChange, preventVirtualKeyboard]);

  // State for nuclear warning
  const [showWarning, setShowWarning] = useState(false);
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null);

  // Show warning if someone tries to exit
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab/window switched - show aggressive warning
        setShowWarning(true);
        
        // Play single warning sound (not continuous)
        if (process.env.NODE_ENV === 'production') {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Lower volume
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1); // Very short
          } catch (e) {
            // Audio not supported
          }
        }
        
        // Auto-hide warning after 3 seconds
        const timer = setTimeout(() => {
          setShowWarning(false);
          // Force back to kiosk
          enterFullscreen();
        }, 3000);
        
        setWarningTimer(timer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (warningTimer) {
        clearTimeout(warningTimer);
      }
    };
  }, [showWarning, warningTimer, enterFullscreen]);

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
      
      {/* NUCLEAR WARNING - appears when trying to use as personal device */}
      {showWarning && (
        <div className="fixed inset-0 bg-red-900 z-50 flex items-center justify-center p-8">
          <div className="bg-black bg-opacity-90 p-8 rounded-2xl max-w-2xl text-center border-4 border-red-600 animate-pulse">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              DEVICE LOCKED FOR GYM USE ONLY
            </h1>
            <p className="text-xl text-red-300 mb-6">
              This tablet is for card tapping only!
            </p>
            <div className="text-lg text-gray-300 space-y-2">
              <p>• Do not attempt to browse the web</p>
              <p>• Do not try to use social media</p>
              <p>• This device is monitored</p>
              <p>• Returning to kiosk mode in 3 seconds...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}