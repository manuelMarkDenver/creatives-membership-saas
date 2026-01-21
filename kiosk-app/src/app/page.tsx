'use client';

import { useEffect, useState } from 'react';

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

  const handleTap = async () => {
    if (isProcessing || cardUid.length === 0) return;

    setIsProcessing(true);

    try {
      const storedId = localStorage.getItem('terminalId');
      const storedSecret = localStorage.getItem('terminalSecret');

      if (!storedId || !storedSecret) {
        setResult({ result: 'ERROR', message: 'Terminal not configured' });
        return;
      }

      // Decode the stored encoded values
      const terminalId = atob(storedId);
      const terminalSecret = atob(storedSecret);

      // Base64 encode again for transmission
      const encodedId = btoa(terminalId);
      const encodedSecret = btoa(terminalSecret);

      const apiBase = process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://happy-respect-production.up.railway.app');
      console.log('API URL:', apiBase, 'ENV:', process.env.NODE_ENV, 'NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      const response = await fetch(`${apiBase}/api/v1/access/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Terminal-Id-Encoded': encodedId,
          'X-Terminal-Secret-Encoded': encodedSecret,
        },
        body: JSON.stringify({ cardUid }),
      });

      const data = await response.json();
      setResult(data);

      // Play sound based on result
      playSound(data.result);

      // Auto reset after 3 seconds
      setTimeout(() => {
        setCardUid('');
        setResult(null);
      }, 3000);

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

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${getBackgroundColor()}`}>
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
