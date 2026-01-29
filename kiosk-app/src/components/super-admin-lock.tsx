'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface SuperAdminLockProps {
  children: React.ReactNode;
  superAdminPin?: string; // Your super admin PIN
  adminSessionDuration?: number; // Admin session in ms (default: 5 minutes)
}

export default function SuperAdminLock({ 
  children, 
  superAdminPin = '7890', // Default super admin PIN
  adminSessionDuration = 5 * 60 * 1000 // 5 minutes
}: SuperAdminLockProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [adminSessionTimer, setAdminSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(adminSessionDuration);
  const tapAreaRef = useRef<HTMLDivElement>(null);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(() => {
    if (isDev) {
      return;
    }
    const elem = document.documentElement;
    if (elem.requestFullscreen && !document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.log(`Fullscreen error: ${err.message}`);
      });
    }
  }, [isDev]);

  // Exit fullscreen (admin only)
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // Start admin session timer
  const startAdminSession = useCallback(() => {
    // Clear existing timer
    if (adminSessionTimer) {
      clearInterval(adminSessionTimer);
    }

    // Set time left
    setTimeLeft(adminSessionDuration);

    // Start countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          lockKiosk(); // Auto-lock when time expires
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    setAdminSessionTimer(timer);
  }, [adminSessionDuration, adminSessionTimer]);

  // Lock kiosk (exit admin mode)
  const lockKiosk = useCallback(() => {
    setIsAdminMode(false);
    setShowPinInput(false);
    setPinInput('');
    
    if (adminSessionTimer) {
      clearInterval(adminSessionTimer);
      setAdminSessionTimer(null);
    }
    
    enterFullscreen();
  }, [adminSessionTimer, enterFullscreen]);

  // Handle secret tap in top-left corner
  const handleSecretTap = useCallback((e: MouseEvent) => {
    // Only check taps in top-left corner (50x50px area)
    if (e.clientX > 50 || e.clientY > 50) return;
    
    // Increment tap count
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    // Reset tap count after 3 seconds
    setTimeout(() => {
      setTapCount(0);
    }, 3000);
    
    // Show PIN input after 7 taps
    if (newTapCount >= 7 && !isAdminMode) {
      setShowPinInput(true);
      setTapCount(0);
    }
  }, [tapCount, isAdminMode]);

  // Handle PIN input
  const handlePinDigit = useCallback((digit: string) => {
    if (digit === 'clear') {
      setPinInput('');
    } else if (digit === 'enter') {
      if (pinInput === superAdminPin) {
        // Correct PIN - enter admin mode
        setIsAdminMode(true);
        setShowPinInput(false);
        setPinInput('');
        startAdminSession();
      } else {
        // Wrong PIN - shake and clear
        setPinInput('');
        const pinDisplay = document.getElementById('pin-display');
        if (pinDisplay) {
          pinDisplay.classList.add('animate-shake');
          setTimeout(() => {
            pinDisplay.classList.remove('animate-shake');
          }, 500);
        }
      }
    } else if (digit === 'cancel') {
      setShowPinInput(false);
      setPinInput('');
    } else {
      // Add digit (max 4 digits)
      if (pinInput.length < 4) {
        setPinInput(pinInput + digit);
      }
    }
  }, [pinInput, superAdminPin, startAdminSession]);

  // Handle keyboard for PIN input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // When PIN input is shown
    if (showPinInput) {
      if (e.key >= '0' && e.key <= '9') {
        handlePinDigit(e.key);
      } else if (e.key === 'Enter') {
        handlePinDigit('enter');
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handlePinDigit('clear');
      } else if (e.key === 'Escape') {
        handlePinDigit('cancel');
      }
      e.preventDefault();
      return;
    }

    // In admin mode, allow normal keyboard
    if (isAdminMode) return;

    // In kiosk mode, block most keys
    // Allow only alphanumeric for card reading
    if (!/^[a-zA-Z0-9]$/.test(e.key) && e.key !== 'Enter') {
      e.preventDefault();
    }
  }, [showPinInput, isAdminMode, handlePinDigit]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Allow right-click in dev and while in admin mode
    if (process.env.NODE_ENV === 'development' || isAdminMode) {
      return;
    }
    e.preventDefault();
  }, [isAdminMode]);

  // Prevent navigation
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (!isAdminMode) {
      e.preventDefault();
      e.returnValue = 'Kiosk is locked. Only super admin can exit.';
    }
  }, [isAdminMode]);

  // Prevent exiting fullscreen in kiosk mode
  const handleFullscreenChange = useCallback(() => {
    if (isDev) {
      return;
    }
    if (!document.fullscreenElement && !isAdminMode) {
      enterFullscreen();
    }
  }, [isAdminMode, enterFullscreen, isDev]);

  // Setup
  useEffect(() => {
    if (isDev) {
      // In development, don't enforce fullscreen/lockdown.
      return;
    }
    // Enter fullscreen on mount
    enterFullscreen();
    
    // Add event listeners
    document.addEventListener('click', handleSecretTap);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleSecretTap);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      if (adminSessionTimer) {
        clearInterval(adminSessionTimer);
      }
    };
  }, [enterFullscreen, handleSecretTap, handleKeyDown, handleContextMenu, handleBeforeUnload, handleFullscreenChange, adminSessionTimer, isDev]);

  // Format time left
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Admin mode UI
  if (isAdminMode) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Super Admin Mode</h1>
              <p className="text-gray-400">Session expires in: {formatTimeLeft()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  exitFullscreen();
                  window.location.href = '/setup';
                }}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm md:text-base"
              >
                Terminal Setup
              </button>
              <button
                onClick={lockKiosk}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm md:text-base"
              >
                Lock Kiosk
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-4 flex-1">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => window.open('http://localhost:3000', '_blank')}
                className="bg-green-700 hover:bg-green-800 p-4 rounded-lg text-left"
              >
                <div className="text-lg font-medium">Main App</div>
                <div className="text-sm text-gray-300">Open admin dashboard</div>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-700 hover:bg-yellow-800 p-4 rounded-lg text-left"
              >
                <div className="text-lg font-medium">Reload Kiosk</div>
                <div className="text-sm text-gray-300">Restart kiosk app</div>
              </button>
              
              <button
                onClick={() => {
                  exitFullscreen();
                  window.location.href = '/';
                }}
                className="bg-purple-700 hover:bg-purple-800 p-4 rounded-lg text-left"
              >
                <div className="text-lg font-medium">Exit Fullscreen</div>
                <div className="text-sm text-gray-300">Return to normal browser</div>
              </button>
            </div>

            {/* Current Status */}
            <div className="mt-8 bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium mb-2">Current Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Mode</div>
                  <div className="text-green-400 font-medium">Super Admin</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Time Remaining</div>
                  <div className="font-mono">{formatTimeLeft()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center text-gray-400 text-sm mt-4">
            <p>Kiosk will auto-lock when timer expires</p>
            <p className="mt-1">To unlock again: Tap top-left corner 7 times, then enter PIN: {superAdminPin}</p>
          </div>
        </div>
      </div>
    );
  }

  // PIN input UI
  if (showPinInput) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm mx-4">
          <h2 className="text-xl font-bold text-white text-center mb-4">Super Admin PIN</h2>
          
          {/* PIN display */}
          <div 
            id="pin-display"
            className="bg-gray-900 text-white text-2xl font-mono text-center py-4 rounded-lg mb-6"
          >
            {pinInput.replace(/./g, '•')}
            {pinInput.length < 4 && <span className="animate-pulse">|</span>}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'enter'].map((key) => (
              <button
                key={key}
                onClick={() => handlePinDigit(key.toString())}
                className={`
                  py-4 rounded-lg font-medium text-lg
                  ${key === 'clear' ? 'bg-red-700 hover:bg-red-800' : 
                    key === 'enter' ? 'bg-green-700 hover:bg-green-800' : 
                    'bg-gray-700 hover:bg-gray-600'}
                `}
              >
                {key === 'clear' ? 'C' : key === 'enter' ? '✓' : key}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePinDigit('cancel')}
            className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Normal kiosk mode
  return (
    <>
      {children}
      
      {/* Hidden tap area (invisible) */}
      <div 
        ref={tapAreaRef}
        className="fixed top-0 left-0 w-12 h-12 z-40"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Super admin hint (only in dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 left-2 text-xs text-gray-400 bg-black bg-opacity-30 px-2 py-1 rounded">
          Dev: Tap here 7x for admin
        </div>
      )}
    </>
  );
}
