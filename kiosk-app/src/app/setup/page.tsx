'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [terminalId, setTerminalId] = useState('');
  const [terminalSecret, setTerminalSecret] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleTest = async () => {
    if (!terminalId || !terminalSecret) {
      setError('Please enter both Terminal ID and Secret');
      return;
    }

    setIsTesting(true);
    setError('');

    try {
      const response = await fetch('/api/access/terminals/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Terminal-Id': terminalId,
          'X-Terminal-Secret': terminalSecret,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Store in localStorage
        localStorage.setItem('terminalId', terminalId);
        localStorage.setItem('terminalSecret', terminalSecret);
        router.push('/');
      } else {
        setError('Invalid terminal credentials');
      }
    } catch (err) {
      setError('Network error - check backend connection');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Kiosk Setup</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terminal ID
            </label>
            <input
              type="text"
              value={terminalId}
              onChange={(e) => setTerminalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter terminal ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terminal Secret
            </label>
            <input
              type="password"
              value={terminalSecret}
              onChange={(e) => setTerminalSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter terminal secret"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleTest}
            disabled={isTesting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Testing...' : 'Test & Save'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Test credentials:</p>
          <p>ID: test-terminal-1</p>
          <p>Secret: test-secret-123</p>
        </div>
      </div>
    </div>
  );
}