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
  const inputRef = useRef<HTMLInputElement>(null);

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
        console.log(`Fullscreen error: ${err.message}`);
      });
    }
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
    console.log('handleTap called with raw cardUid:', cardUid, 'normalized:', normalizedUid);

    if (isProcessing || normalizedUid.length === 0) {
      console.log('Skipping tap - isProcessing:', isProcessing, 'normalizedUid length:', normalizedUid.length);
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
    console.log('Starting card check process...');

    try {
      const storedId = localStorage.getItem('terminalId');
      const storedSecret = localStorage.getItem('terminalSecret');
      console.log('Terminal config - ID exists:', !!storedId, 'Secret exists:', !!storedSecret);

      if (!storedId || !storedSecret) {
        console.error('Terminal not configured');
        setResult({ result: 'ERROR', message: 'Terminal not configured' });
        return;
      }

      // Decode the stored encoded values
      const terminalId = atob(storedId);
      const terminalSecret = atob(storedSecret);
      console.log('Decoded terminal ID:', terminalId);

      // Base64 encode again for transmission
      const encodedId = btoa(terminalId);
      const encodedSecret = btoa(terminalSecret);

      const apiBase = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://happy-respect-production.up.railway.app');
      console.log('API URL:', apiBase, 'ENV:', process.env.NODE_ENV, 'NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

      const requestUrl = `${apiBase}/api/v1/access/check`;
      console.log('🚀 KIOSK: Making API call to:', requestUrl, 'with normalized cardUid:', normalizedUid);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Terminal-Id-Encoded': encodedId,
          'X-Terminal-Secret-Encoded': encodedSecret,
        },
        body: JSON.stringify({ cardUid: normalizedUid }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        setResult({ result: 'ERROR', message: errorData.message || 'API Error' });
        return;
      }

       const data = await response.json();
       console.log('API Response data:', data);
        setResult(data);

       // Check if SUPER_ADMIN card
       if (data.result === 'SUPER_ADMIN') {
         console.log('SUPER_ADMIN card detected, entering admin mode');
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

    if (
      ['ALLOW', 'ASSIGNED', 'ALLOW_AUTO_ASSIGNED', 'RECLAIMED', 'DAILY_OK', 'SUPER_ADMIN'].includes(result)
    ) {
      // Success sound - high pitch, short
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (isDenyResult) {
      // Deny sound - medium pitch, medium duration
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      // Error sound - low pitch, long
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
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

  // Check network connectivity
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      console.log(`🌐 Network status: ${online ? 'Online' : 'Offline'}`);
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

  // Auto-focus the hidden input for RFID keyboard emulation
  useEffect(() => {
    if (inputRef.current && !result) {
      inputRef.current.focus();
    }
  }, [result]);

  // Admin mode UI
  if (isAdminMode) {
    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 p-4 md:p-8">
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
                onClick={() => window.location.reload()}
                className="bg-yellow-700 hover:bg-yellow-800 p-4 rounded-lg text-left"
              >
                <div className="text-lg font-medium">Reload Kiosk</div>
                <div className="text-sm text-gray-300">Restart kiosk app</div>
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
    );
  }

  return (
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

      {/* Hidden input for RFID keyboard emulation */}
      <input
        ref={inputRef}
        type="text"
        value={cardUid}
        onChange={(e) => setCardUid(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && cardUid.length > 0) {
            handleTap();
            setCardUid(''); // Clear after processing
          }
        }}
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
        autoFocus={!result}
      />
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
  );
}

export default function KioskPage() {
  return (
    <KioskLockSimple>
      <KioskPageContent />
    </KioskLockSimple>
  );
}
