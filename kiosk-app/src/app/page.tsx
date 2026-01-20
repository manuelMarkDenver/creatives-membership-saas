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
      const terminalId = localStorage.getItem('terminalId');
      const terminalSecret = localStorage.getItem('terminalSecret');

      if (!terminalId || !terminalSecret) {
        setResult({ result: 'ERROR', message: 'Terminal not configured' });
        return;
      }

      const response = await fetch('/api/access/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Terminal-Id': terminalId,
          'X-Terminal-Secret': terminalSecret,
        },
        body: JSON.stringify({ cardUid }),
      });

      const data = await response.json();
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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
          return 'Access Denied - Membership Expired';
        case 'DENY_UNKNOWN':
          return 'Access Denied - Unknown Card';
        case 'DENY_DISABLED':
          return 'Access Denied - Card Disabled';
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
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-8">
          {getText()}
        </h1>
        {result && result.expiresAt && (
          <p className="text-2xl">
            Expires: {new Date(result.expiresAt).toLocaleDateString()}
          </p>
        )}
        {!result && cardUid && (
          <p className="text-2xl opacity-50">
            Reading card... ({cardUid.length} chars)
          </p>
        )}
      </div>
    </div>
  );
}
