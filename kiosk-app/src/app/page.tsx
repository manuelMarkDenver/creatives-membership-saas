'use client';

import { useEffect, useState, useRef } from 'react';

type AccessResult = {
  result: string;
  message?: string;
  memberName?: string;
  expiresAt?: string;
};

export default function KioskPage() {
  const [cardUid, setCardUid] = useState('');
  const [result, setResult] = useState<AccessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (result) return; // Don't capture while showing result

      if (event.key === 'Enter' && cardUid.length > 0) {
        handleTap();
      } else if (event.key.length === 1) { // Single character
        setCardUid(prev => prev + event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardUid, result]);

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

      // Play sound based on result
      playSound(data.result);

      // Auto reset after 2 seconds
      setTimeout(() => {
        setCardUid('');
        setResult(null);
      }, 2000);

    } catch (error) {
      setResult({ result: 'ERROR', message: 'Network error' });
      setTimeout(() => {
        setCardUid('');
        setResult(null);
      }, 2000);
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

    if (result === 'ALLOW') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
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
      default: return 'bg-red-500';
    }
  };

  const getText = () => {
    if (result) {
      switch (result.result) {
        case 'ALLOW':
          return `Welcome, ${result.memberName}!`;
        case 'DENY_EXPIRED':
          return `MEMBER EXPIRED - ${result.memberName}`;
        case 'DENY_UNKNOWN':
          return 'Access Denied - Unknown Card';
        case 'DENY_DISABLED':
          return `MEMBER DISABLED - ${result.memberName}`;
        case 'ASSIGNED':
          return `Card Assigned to ${result.memberName}`;
        case 'IGNORED_DUPLICATE_TAP':
          return 'Please Wait - Duplicate Tap';
        default:
          return result.message || 'Error';
      }
    }
    return 'TAP CARD';
  };

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

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${getBackgroundColor()}`}>
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
      <div className="w-[800px] h-[800px] rounded-full border-8 border-white border-opacity-30 flex items-center justify-center">
        <div className="text-center text-white px-8">
          <h1 className={`font-bold mb-6 ${!result ? 'text-9xl' : 'text-7xl'}`}>
            {getText()}
          </h1>
          {result && result.expiresAt && result.result !== 'DENY_EXPIRED' && (
            <p className="text-6xl font-bold">
              Expires: {new Date(result.expiresAt).toLocaleDateString()}
            </p>
          )}
          {result && result.expiresAt && result.result === 'DENY_EXPIRED' && (
            <p className="text-6xl font-bold">
              Expired: {new Date(result.expiresAt).toLocaleDateString()}
            </p>
          )}
          {!result && cardUid && (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl opacity-70">Reading card</div>
              <div className="flex space-x-2">
                <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
                <div className="w-6 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-6 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
