'use client'

import { useState } from 'react'
import { Crown, Monitor, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { apiClient } from '@/lib/api/client'

export default function AdminTerminalsPage() {
  const { data: profile } = useProfile()
  const [tenantId, setTenantId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [terminals, setTerminals] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newBranchId, setNewBranchId] = useState('')
  const [newName, setNewName] = useState('')
  const [createResult, setCreateResult] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-12">
        <Crown className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need Super Admin privileges to manage terminals.
        </p>
      </div>
    )
  }

  const load = async () => {
    setError(null)
    setCreateResult(null)
    setTerminals(null)

    if (!tenantId.trim()) {
      setError('tenantId is required')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.get('/admin/terminals', {
        params: {
          tenantId: tenantId.trim(),
          ...(branchId.trim() ? { branchId: branchId.trim() } : {}),
        },
      })
      setTerminals(res.data)
    } catch (e) {
      setError((e as any)?.message || 'Failed to load terminals')
    } finally {
      setIsLoading(false)
    }
  }

  const create = async () => {
    setError(null)
    setCreateResult(null)

    if (!tenantId.trim() || !newBranchId.trim() || !newName.trim()) {
      setError('tenantId, branchId, and name are required')
      return
    }

    setIsCreating(true)
    try {
      const res = await apiClient.post('/admin/terminals', {
        tenantId: tenantId.trim(),
        branchId: newBranchId.trim(),
        name: newName.trim(),
      })
      setCreateResult(res.data)
      await load()
    } catch (e) {
      setError((e as any)?.message || 'Failed to create terminal')
    } finally {
      setIsCreating(false)
    }
  }

  const rotateSecret = async (terminalId: string) => {
    setError(null)
    setCreateResult(null)

    if (!tenantId.trim()) {
      setError('tenantId is required')
      return
    }

    try {
      const res = await apiClient.post(`/admin/terminals/${terminalId}/rotate-secret`, {
        tenantId: tenantId.trim(),
      })
      setCreateResult(res.data)
    } catch (e) {
      setError((e as any)?.message || 'Failed to rotate secret')
    }
  }

  const toggleActive = async (terminalId: string, isActive: boolean) => {
    setError(null)
    if (!tenantId.trim()) {
      setError('tenantId is required')
      return
    }

    try {
      await apiClient.patch(`/admin/terminals/${terminalId}`, {
        tenantId: tenantId.trim(),
        isActive,
      })
      await load()
    } catch (e) {
      setError((e as any)?.message || 'Failed to update terminal')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Terminals</h1>
        <p className="text-sm text-gray-500">
          Register kiosks (tablet terminals) and rotate secrets when needed.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>tenantId</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="space-y-2">
            <Label>branchId (optional filter)</Label>
            <Input value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="UUID" />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <Button onClick={load} disabled={isLoading}>
          <Monitor className="h-4 w-4 mr-2" />
          {isLoading ? 'Loading…' : 'Load terminals'}
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create Terminal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>branchId</Label>
            <Input value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="space-y-2">
            <Label>name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Front Desk Kiosk" />
          </div>
        </div>
        <Button onClick={create} disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create terminal'}
        </Button>
        <p className="text-xs text-gray-500">
          The secret is shown once. Copy it into the kiosk setup screen.
        </p>
      </div>

      {createResult && (
        <div className="rounded-lg border bg-white p-6 space-y-2">
          <h2 className="text-lg font-semibold">Secret / Response</h2>
          <Textarea value={JSON.stringify(createResult, null, 2)} readOnly className="font-mono h-40" />
        </div>
      )}

      {terminals && (
        <div className="rounded-lg border bg-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Terminals</h2>
            <div className="text-sm text-gray-600">{terminals.length} total</div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">id</th>
                  <th className="text-left py-2 pr-4">name</th>
                  <th className="text-left py-2 pr-4">branch</th>
                  <th className="text-left py-2 pr-4">active</th>
                  <th className="text-left py-2 pr-4">lastSeenAt</th>
                  <th className="text-left py-2 pr-4">actions</th>
                </tr>
              </thead>
              <tbody>
                {terminals.map((t) => (
                  <tr key={t.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-mono">{t.id}</td>
                    <td className="py-2 pr-4">{t.name}</td>
                    <td className="py-2 pr-4">
                      <div className="font-mono text-xs">{t.gymId}</div>
                      <div className="text-xs text-gray-500">{t.gym?.name || ''}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={t.isActive ? 'text-green-700' : 'text-gray-500'}>
                        {t.isActive ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {t.lastSeenAt ? new Date(t.lastSeenAt).toLocaleString() : ''}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateSecret(t.id)}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Rotate secret
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(t.id, !t.isActive)}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
