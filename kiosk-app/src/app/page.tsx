'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import KioskLockSimple from '@/components/kiosk-lock-simple';

type AccessResult = {
  result: string;
  message?: string;
  memberName?: string;
  expiresAt?: string;
};

function KioskPageContent() {
  const [cardUid, setCardUid] = useState('');
  const [result, setResult] = useState<AccessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminSessionTimer, setAdminSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const [adminTimeLeft, setAdminTimeLeft] = useState(5 * 60 * 1000); // 5 minutes
  const [debugMode, setDebugMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shouldLog = process.env.NODE_ENV === 'development' && debugMode;
  const log = (...args: any[]) => {
    if (shouldLog) console.log(...args);
  };

  // Start admin session
  const startAdminSession = useCallback(() => {
    // Clear existing timer
    if (adminSessionTimer) {
      clearInterval(adminSessionTimer);
    }

    // Set time left
    setAdminTimeLeft(5 * 60 * 1000);

    // Start countdown
    const timer = setInterval(() => {
      setAdminTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          lockKiosk(); // Auto-lock when time expires
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    setAdminSessionTimer(timer);
    setIsAdminMode(true);
  }, [adminSessionTimer]);

  // Reset kiosk to initial state (soft reload)
  const resetKiosk = useCallback(() => {
    if (!confirm('Reset kiosk to tapping mode? This will clear any current card reading.')) {
      return;
    }
    
    log('🚀 RESET TO TAPPING - Starting reset process...');
    
    // Clear all state
    setIsAdminMode(false);
    setCardUid('');
    setResult(null);
    setDebugInfo('');
    
    if (adminSessionTimer) {
      clearInterval(adminSessionTimer);
      setAdminSessionTimer(null);
    }
    
    // Ensure fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen && !document.fullscreenElement) {
       elem.requestFullscreen().catch(err => {
         log(`Fullscreen error: ${err.message}`);
       });
    }
    
    // CRITICAL: Refocus input with AGGRESSIVE multiple attempts
    // Wait for React to re-render after state changes
    log('Starting aggressive refocus attempts...');
    
    const refocusInput = (attempt: number) => {
      if (inputRef.current) {
        try {
          inputRef.current.focus();
          const isFocused = document.activeElement === inputRef.current;
           log(`Refocus attempt ${attempt}: ${isFocused ? 'SUCCESS' : 'FAILED'}`);
          return isFocused;
        } catch (error) {
           log(`Refocus attempt ${attempt}: ERROR - ${error}`);
          return false;
        }
      }
       log(`Refocus attempt ${attempt}: inputRef.current is null`);
      return false;
    };
    
    // AGGRESSIVE timing: Multiple attempts covering React render cycles
    // 0ms, 50ms, 100ms, 200ms, 400ms, 800ms - covers all possible render timings
    setTimeout(() => refocusInput(1), 0);
    setTimeout(() => refocusInput(2), 50);
    setTimeout(() => refocusInput(3), 100);
    setTimeout(() => refocusInput(4), 200);
    setTimeout(() => refocusInput(5), 400);
    setTimeout(() => refocusInput(6), 800);
    setTimeout(() => refocusInput(7), 1200); // Nuclear option
    
    // Also trigger the focus management useEffect by forcing a state update
    setTimeout(() => {
      // Force a dummy state update to trigger focus useEffect
      setCardUid(prev => prev);
    }, 10);
  }, [adminSessionTimer]);

  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    
    // Store debug mode in localStorage for kiosk-lock-simple to read
    localStorage.setItem('kiosk-debug-mode', newDebugMode.toString());
    
    log(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`);
    
    if (newDebugMode) {
      // Enable right-click and dev tools when debug mode is on
      log('Right-click and dev tools enabled for debugging');
      alert('Debug mode enabled: Right-click and keyboard shortcuts are now allowed');
    } else {
      alert('Debug mode disabled: Security restrictions re-enabled');
    }
  }, [debugMode]);

  // Lock kiosk (exit admin mode)
  const lockKiosk = useCallback(() => {
    setIsAdminMode(false);
    
    if (adminSessionTimer) {
      clearInterval(adminSessionTimer);
      setAdminSessionTimer(null);
    }
    
    // Re-enter fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen && !document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        log(`Fullscreen error: ${err.message}`);
      });
    }
    
    // CRITICAL: Refocus input after exiting admin mode
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
         log('Refocused input after locking kiosk');
       }
     }, 100);
  }, [adminSessionTimer]);

  // Format time left
  const formatTimeLeft = () => {
    const minutes = Math.floor(adminTimeLeft / 60000);
    const seconds = Math.floor((adminTimeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };



  // Normalize card UID - handle common RFID reader differences
  const normalizeCardUid = (rawUid: string): string => {
    // Remove any whitespace and convert to uppercase
    let normalized = rawUid.trim().toUpperCase();

    let debug = `🔍 Raw: ${rawUid}\n`;
    debug += `📝 Cleaned: ${normalized}\n`;

    // Handle different UID formats from various RFID readers
    if (normalized.length >= 8 && /^\d+$/.test(normalized)) {
      // Database format appears to be 10-digit with leading zeros
      // Standardize to 10-digit format with leading zeros

      let candidate = normalized;

      // Special handling for 20-character raw (hex UID format)
      if (candidate.length === 20) {
        // Extract the embedded decimal ID from hex UID format
        candidate = candidate[2] + candidate[3] + candidate[4] + candidate[6] + candidate[8] + candidate[10] + candidate[12] + candidate[14] + candidate[16] + candidate[18];
        debug += `🔧 Extracted ID from hex UID: ${candidate}\n`;
      } else {
        // Ensure exactly 10 digits by padding with leading zeros
        if (candidate.length < 10) {
          candidate = candidate.padStart(10, '0');
          debug += `📏 Padded: ${candidate}\n`;
        } else if (candidate.length > 10) {
          candidate = candidate.substring(0, 10);
          debug += `✂️ Truncated: ${candidate}\n`;
        } else {
          debug += `✅ 10 digits: ${candidate}\n`;
        }
      }

      // Simple approach: if it doesn't start with '000', try reversing the string
      // This handles the tablet reader issue where UIDs come reversed
      let finalUid = candidate;
      if (!candidate.startsWith('000')) {
        const reversed = candidate.split('').reverse().join('');
        if (reversed.startsWith('000')) {
          finalUid = reversed;
          debug += `🔄 Reversed (tablet reader fix): ${reversed}\n`;
        } else {
          debug += `⚠️  No transformation applied\n`;
        }
      } else {
        debug += `✅ Already correct format\n`;
      }

      debug += `📤 Final UID: ${finalUid}`;
      setDebugInfo(debug);
      return finalUid;
    }

    debug += `📤 Final UID: ${normalized}`;
    setDebugInfo(debug);
    return normalized;
  };

  const handleTap = async () => {
    const normalizedUid = normalizeCardUid(cardUid);
    log('handleTap called with raw cardUid:', cardUid, 'normalized:', normalizedUid);

    if (isProcessing || normalizedUid.length === 0) {
      log('Skipping tap - isProcessing:', isProcessing, 'normalizedUid length:', normalizedUid.length);
      return;
    }

    // Check if offline
    if (!isOnline) {
      setResult({ result: 'ERROR', message: 'Network offline - Please check internet connection' });
      setTimeout(() => {
        setCardUid('');
        setResult(null);
      }, 3000);
      return;
    }

    setIsProcessing(true);
    log('Starting card check process...');

    try {
      const storedId = localStorage.getItem('terminalId');
      const storedSecret = localStorage.getItem('terminalSecret');
      log('Terminal config - ID exists:', !!storedId, 'Secret exists:', !!storedSecret);

      if (!storedId || !storedSecret) {
        setResult({ result: 'ERROR', message: 'Terminal not configured' });
        return;
      }

      // Decode the stored encoded values
      const terminalId = atob(storedId);
      const terminalSecret = atob(storedSecret);
      log('Decoded terminal ID:', terminalId);

      // Base64 encode again for transmission
      const encodedId = btoa(terminalId);
      const encodedSecret = btoa(terminalSecret);

      const apiBase = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://happy-respect-production.up.railway.app');
      log('API URL:', apiBase, 'ENV:', process.env.NODE_ENV, 'NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

      const requestUrl = `${apiBase}/api/v1/access/check`;
      log('🚀 KIOSK: Making API call to:', requestUrl, 'with normalized cardUid:', normalizedUid);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Terminal-Id-Encoded': encodedId,
          'X-Terminal-Secret-Encoded': encodedSecret,
        },
        body: JSON.stringify({ cardUid: normalizedUid }),
      });

      log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        log('API Error:', response.status, errorData);
        setResult({ result: 'ERROR', message: errorData.message || 'API Error' });
        return;
      }

       const data = await response.json();
        log('API Response data:', data);
        setResult(data);

       // Check if SUPER_ADMIN card
       if (data.result === 'SUPER_ADMIN') {
         log('SUPER_ADMIN card detected, entering admin mode');
         startAdminSession();
       }

       // Play sound based on result
       playSound(data.result);

       // Auto reset after appropriate time
       const resetTime = data.result === 'IGNORED_DUPLICATE_TAP' ? 3000 : 1000;
       setTimeout(() => {
         setCardUid('');
         setResult(null);
       }, resetTime);

    } catch (error) {
       setResult({ result: 'ERROR', message: 'Network error' });
       setTimeout(() => {
         setCardUid('');
         setResult(null);
       }, 1000);
    } finally {
      setIsProcessing(false);
    }
  };

   const playSound = (result: string) => {
     const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
     const audioContext = new AudioContextClass!();
     const oscillator = audioContext.createOscillator();
     const gainNode = audioContext.createGain();

     oscillator.connect(gainNode);
     gainNode.connect(audioContext.destination);

     const isDenyResult = [
       'DENY_EXPIRED',
       'DENY_DISABLED',
       'DENY_GYM_MISMATCH',
       'DENY_AUTO_ASSIGNED_EXPIRED',
       'DENY_EXPIRED_PENDING',
       'DENY_RECLAIM_MISMATCH',
     ].includes(result);

     // Volume: EXTRA LOUD in production (annoying!), normal in development
     const volume = process.env.NODE_ENV === 'production' ? 1.0 : 0.4;
     const durationMultiplier = process.env.NODE_ENV === 'production' ? 1.5 : 1.0;

     if (
       ['ALLOW', 'ASSIGNED', 'ALLOW_AUTO_ASSIGNED', 'RECLAIMED', 'DAILY_OK', 'SUPER_ADMIN'].includes(result)
     ) {
       // Success sound - VERY high pitch, longer in production
       const freq = process.env.NODE_ENV === 'production' ? 1200 : 800;
       const duration = 0.2 * durationMultiplier;
       oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
       gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
       oscillator.start(audioContext.currentTime);
       oscillator.stop(audioContext.currentTime + duration);
     } else if (isDenyResult) {
       // Deny sound - annoying medium pitch, longer in production
       const freq = process.env.NODE_ENV === 'production' ? 900 : 600;
       const duration = 0.4 * durationMultiplier;
       oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
       gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
       oscillator.start(audioContext.currentTime);
       oscillator.stop(audioContext.currentTime + duration);
     } else {
       // Error sound - grating low pitch, much longer in production
       const freq = process.env.NODE_ENV === 'production' ? 700 : 400;
       const duration = 0.8 * durationMultiplier;
       oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
       gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
       oscillator.start(audioContext.currentTime);
       oscillator.stop(audioContext.currentTime + duration);
     }
   };

  const getBackgroundColor = () => {
    if (!result) return 'bg-blue-500';
    switch (result.result) {
      case 'ALLOW': return 'bg-green-500';
      case 'ASSIGNED': return 'bg-green-500';
      case 'ALLOW_AUTO_ASSIGNED': return 'bg-green-500';
      case 'RECLAIMED': return 'bg-green-500';
      case 'DAILY_OK': return 'bg-green-500';
      case 'SUPER_ADMIN': return 'bg-purple-500';
      case 'IGNORED_DUPLICATE_TAP': return 'bg-amber-500';
      default: return 'bg-red-500';
    }
  };

  const getText = () => {
    if (result) {
      switch (result.result) {
         case 'ALLOW':
           return 'SUCCESS';
       case 'ASSIGNED':
         return 'SUCCESS';
       case 'ALLOW_AUTO_ASSIGNED':
         return 'SUCCESS';
       case 'RECLAIMED':
         return 'SUCCESS';
       case 'DAILY_OK':
         return 'DAILY RECORDED';
       case 'SUPER_ADMIN':
         return 'ADMIN ACCESS';
      case 'DENY_EXPIRED':
      case 'DENY_DISABLED':
      case 'DENY_GYM_MISMATCH':
      case 'DENY_AUTO_ASSIGNED_EXPIRED':
      case 'DENY_EXPIRED_PENDING':
      case 'DENY_UNKNOWN':
      case 'DENY_INVENTORY':
        return 'ACCESS DENIED';
      case 'DENY_RECLAIM_MISMATCH':
        return 'ERROR';
      case 'ERROR':
      case 'IGNORED_DUPLICATE_TAP':
        return 'WAIT';
      default:
        return 'ERROR';
      }
    }
    return 'TAP CARD';
  };

  const getDetailedMessage = () => {
    if (!result) return null;

    let message = '';

    switch (result.result) {
      case 'ALLOW':
        message = result.memberName || 'Member';
        break;
      case 'DENY_EXPIRED':
        message = `${result.memberName || 'Member'} - Membership Expired`;
        break;
      case 'DENY_UNKNOWN':
        message = 'Unknown Card - Please contact staff';
        break;
      case 'DENY_RECLAIM_MISMATCH':
        message = result.message || 'Wrong card - please tap the returned card';
        break;
      case 'DENY_DISABLED':
        message = `${result.memberName || 'Member'} - Card Disabled`;
        break;
      case 'DENY_GYM_MISMATCH':
        message = 'This card belongs to a different gym location.\nPlease visit the gym where your membership is registered.';
        break;
       case 'ASSIGNED':
         message = `Card Assigned to ${result.memberName || 'Member'}`;
         break;
       case 'RECLAIMED':
         message = `Card reclaimed for ${result.memberName || 'Member'}`;
         break;
       case 'DAILY_OK':
         message = 'Daily walk-in recorded';
         break;
       case 'SUPER_ADMIN':
         message = result.message || 'Super Admin Access Granted';
         break;
       case 'IGNORED_DUPLICATE_TAP':
         message = 'Tap Once';
         break;
       default:
         message = result.message || 'Error';
         break;
    }

    // Add expiration info for relevant cases
    if (result.expiresAt && (result.result === 'ALLOW' || result.result === 'DENY_EXPIRED')) {
      const dateStr = new Date(result.expiresAt).toLocaleDateString();
      if (result.result === 'ALLOW') {
        message += `\nExpires: ${dateStr}`;
      } else if (result.result === 'DENY_EXPIRED') {
        message += `\nExpired: ${dateStr}`;
      }
    }

    return message;
  };

  // Set isClient to true after mount (prevents hydration errors)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check network connectivity
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      log(`🌐 Network status: ${online ? 'Online' : 'Offline'}`);
    };

    // Set initial status
    updateOnlineStatus();

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Check if terminal is configured
  useEffect(() => {
    const terminalId = localStorage.getItem('terminalId');
    if (!terminalId) {
      window.location.href = '/setup';
    }
  }, []);

  // Robust focus management for RFID keyboard emulation
  useEffect(() => {
    let focusInterval: NodeJS.Timeout | null = null;

    const focusInput = () => {
      // Only focus if we're in kiosk mode (not admin mode) and no result showing
      if (inputRef.current && !result && !isAdminMode) {
        inputRef.current.focus();
        log('Input focused (kiosk mode)');
        return true;
      }
      return false;
    };

    // Focus immediately if in kiosk mode
    if (!isAdminMode) {
      focusInput();
    }

    // Focus on any click/tap (user might tap anywhere on screen)
    const handleClick = () => {
      focusInput();
    };

    // Focus on visibility change (tab switch, etc.)
    const handleVisibilityChange = () => {
      if (!document.hidden && !isAdminMode) {
        setTimeout(focusInput, 100);
      }
    };

    // Ultra-conservative safety net interval (30 seconds)
    // Only runs in kiosk mode, checks if focus is actually lost
    focusInterval = setInterval(() => {
      if (!isAdminMode && inputRef.current && document.activeElement !== inputRef.current) {
        log('Safety net (30s): Refocusing input');
        focusInput();
      }
    }, 30000); // 30 seconds - ultra conservative safety net

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (focusInterval) {
        clearInterval(focusInterval);
      }
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [result, isAdminMode]);

  // Handle admin mode transitions - CRITICAL FIX
  useEffect(() => {
    if (!isAdminMode) {
      // Just entered kiosk mode (from admin mode or initial load)
      log('Entered kiosk mode, focusing input...');
      setTimeout(() => {
        if (inputRef.current && !result) {
          inputRef.current.focus();
          log('Input focused after entering kiosk mode');
        }
      }, 200);
    }
  }, [isAdminMode, result]);

  return (
    <>
       {/* Hidden input for RFID keyboard emulation - ALWAYS PRESENT */}
      <input
        ref={inputRef}
        type="text"
        value={cardUid}
        onChange={(e) => {
          const next = e.target.value.replace(/\D+/g, '');
          log('Input changed:', next);
          setCardUid(next);
        }}
        onKeyDown={(e) => {
          // Some RFID readers emit extra keys like "Process".
          // We only accept digits and Enter.
          if (e.key === 'Enter') {
            if (cardUid.length > 0) {
              log('Enter pressed, calling handleTap');
              handleTap();
              setCardUid('');
            }
            return;
          }

          if (e.key.length === 1 && /\d/.test(e.key)) {
            log('Key pressed:', e.key, 'cardUid:', cardUid);
            return;
          }

          // Ignore everything else (including "Process", modifiers, etc.)
          e.preventDefault();
        }}
        onBlur={() => {
          log('Input blurred, refocusing...');
          // Immediately refocus if blurred
          setTimeout(() => {
            if (inputRef.current && !result && !isAdminMode) {
              inputRef.current.focus();
              log('Input refocused after blur');
            }
          }, 10);
        }}
        onFocus={() => {
          log('Input focused');
        }}
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
        autoFocus={!result && !isAdminMode}
        inputMode="none" // Prevents on-screen keyboard on mobile
        readOnly={false} // Allow keyboard input from RFID emulator
      />
      
       {/* Focus status indicator (debug only) */}
      {process.env.NODE_ENV === 'development' && isClient && debugMode && (
        <div className="fixed bottom-2 left-2 text-xs bg-black bg-opacity-70 text-white px-2 py-1 rounded z-50">
          Focus: {document.activeElement === inputRef.current ? '✅' : '❌'} | 
          Mode: {isAdminMode ? 'Admin' : 'Kiosk'} |
          Card: {cardUid || 'None'}
        </div>
      )}

       {/* Admin Mode UI */}
      {isAdminMode ? (
        <div className="fixed inset-0 bg-gray-900 text-white z-40 p-4 md:p-8" data-admin-mode="true">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Admin Mode</h1>
                <p className="text-gray-400">Session expires in: {formatTimeLeft()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (document.exitFullscreen && document.fullscreenElement) {
                      document.exitFullscreen();
                    }
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
                   onClick={resetKiosk}
                   className="bg-yellow-700 hover:bg-yellow-800 p-4 rounded-lg text-left"
                 >
                   <div className="text-lg font-medium">Reset to Tapping</div>
                   <div className="text-sm text-gray-300">Clear & restart card reading</div>
                 </button>
                 
                 <button
                   onClick={toggleDebugMode}
                   className={`${debugMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-800'} p-4 rounded-lg text-left`}
                 >
                   <div className="text-lg font-medium">
                     {debugMode ? 'Debug Mode ON' : 'Debug Mode OFF'}
                   </div>
                   <div className="text-sm text-gray-300">
                     {debugMode ? 'Right-click & dev tools enabled' : 'Enable debugging tools'}
                   </div>
                 </button>
                 
                 <button
                   onClick={() => {
                     if (document.exitFullscreen && document.fullscreenElement) {
                       document.exitFullscreen();
                     }
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
                    <div className="text-green-400 font-medium">Admin (Card Unlocked)</div>
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
              <p className="mt-1">To unlock again: Tap SUPER_ADMIN card</p>
            </div>
          </div>
        </div>
      ) : (
        /* Kiosk Mode UI */
        <div className={`h-screen flex flex-col transition-colors duration-300 ${getBackgroundColor()} relative overflow-hidden landscape:pb-64 portrait:pb-48 portrait:justify-center portrait:items-center`}>
          {/* Network status indicator */}
          {!isOnline && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">OFFLINE</span>
            </div>
          )}

          {/* Debug info display - only in development */}
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm font-mono max-w-md z-50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs opacity-70">UID Debug</span>
                <button
                  onClick={() => setDebugInfo('')}
                  className="text-white hover:text-red-400 text-lg leading-none ml-2"
                  aria-label="Close debug"
                >
                  ×
                </button>
              </div>
              <div className="whitespace-pre-line text-xs">{debugInfo}</div>
            </div>
          )}

          <div className="w-[min(600px,70vw,60vh)] h-[min(600px,70vw,60vh)] portrait:w-[min(450px,75vw,65vh)] portrait:h-[min(450px,75vw,65vh)] rounded-full border-8 border-white border-opacity-30 flex items-center justify-center mx-auto landscape:mt-8 portrait:mb-8">
            <div className="text-center text-white px-8">
              <h1 className={`font-bold mb-6 ${!result ? 'text-5xl portrait:text-6xl landscape:text-7xl lg:text-8xl' : 'text-4xl portrait:text-5xl landscape:text-6xl lg:text-7xl'}`}>
                {getText()}
              </h1>
              {!result && cardUid && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-2xl sm:text-3xl lg:text-4xl opacity-70">Reading card</div>
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
                    <div className="w-6 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-6 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed message - positioned below circle for both orientations */}
          {getDetailedMessage() && (
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center text-white max-w-4xl px-8 portrait:bottom-24 landscape:bottom-1/4">
              <p className="text-lg portrait:text-xl landscape:text-2xl lg:text-3xl xl:text-4xl font-bold leading-relaxed whitespace-pre-line drop-shadow-xl bg-black bg-opacity-30 rounded-lg px-4 py-3">
                {getDetailedMessage()}
              </p>
            </div>
          )}
        </div>
       )}

       {/* Tap overlay - only in kiosk mode, captures all taps and refocuses input */}
       {!isAdminMode && (
         <div 
           className="fixed inset-0 z-30"
           onClick={() => {
             // Refocus hidden input on any tap
             if (inputRef.current && !result && !isAdminMode) {
               inputRef.current.focus();
                log('Tap overlay: Input refocused');
              }
            }}
            onTouchStart={() => {
              // Refocus input
              if (inputRef.current && !result && !isAdminMode) {
                inputRef.current.focus();
                log('Tap overlay: Input refocused (touch)');
              }
            }}
           style={{ 
             pointerEvents: 'auto',
             cursor: 'default'
           }}
         />
       )}
     </>
   );
 }

export default function KioskPage() {
  return (
    <KioskLockSimple>
      <KioskPageContent />
    </KioskLockSimple>
  );
}
