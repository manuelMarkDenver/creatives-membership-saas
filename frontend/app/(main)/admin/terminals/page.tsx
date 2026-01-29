'use client'

import { useState } from 'react'
import { AlertCircle, Crown, Monitor, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useTenants } from '@/lib/hooks/use-tenants'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { apiClient } from '@/lib/api/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Branch, Tenant } from '@/types'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>You need Super Admin privileges to manage terminals.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { data: tenantsData, isLoading: tenantsLoading } = useTenants(undefined, {
    enabled: profile?.role === 'SUPER_ADMIN',
  })
  const tenants: Tenant[] = Array.isArray(tenantsData)
    ? tenantsData
    : (tenantsData as any)?.data || []

  const { data: branchesData, isLoading: branchesLoading } = useBranchesByTenant(tenantId)
  const branches: Branch[] = Array.isArray(branchesData)
    ? branchesData
    : (branchesData as any)?.data || []

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
        <p className="text-sm text-muted-foreground">
          Register kiosks (tablet terminals), rotate secrets, and deactivate lost devices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Browse</CardTitle>
          <CardDescription>Load terminals by tenant (optional: filter by branch).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <SearchableDropdown
                value={tenantId}
                onValueChange={(v) => {
                  setTenantId(v)
                  setBranchId('')
                  setNewBranchId('')
                  setTerminals(null)
                  setCreateResult(null)
                  setError(null)
                }}
                items={tenants.map((t) => ({
                  value: t.id,
                  label: t.name,
                  description: t.category,
                }))}
                placeholder={tenantsLoading ? 'Loading tenants…' : 'Select tenant'}
                label="Tenants"
                disabled={tenantsLoading}
                searchPlaceholder="Search tenants…"
                emptyText="No tenants found"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch ID (optional)</Label>
              <SearchableDropdown
                value={branchId || '__ALL__'}
                onValueChange={(v) => {
                  setBranchId(v === '__ALL__' ? '' : v)
                  setTerminals(null)
                }}
                items={[
                  { value: '__ALL__', label: 'All branches' },
                  ...branches.map((b) => ({
                    value: b.id,
                    label: b.name,
                    description: b.address || undefined,
                  })),
                ]}
                placeholder={!tenantId ? 'Select tenant first' : branchesLoading ? 'Loading branches…' : 'All branches'}
                label="Branches"
                disabled={!tenantId || branchesLoading}
                searchPlaceholder="Search branches…"
                emptyText="No branches found"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={load} disabled={isLoading}>
            <Monitor className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading…' : 'Load terminals'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Terminal</CardTitle>
          <CardDescription>
            The secret is shown once. Copy it into the kiosk setup screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Branch ID</Label>
              <SearchableDropdown
                value={newBranchId}
                onValueChange={(v) => {
                  setNewBranchId(v)
                  setCreateResult(null)
                }}
                items={branches.map((b) => ({
                  value: b.id,
                  label: b.name,
                  description: b.address || undefined,
                }))}
                placeholder={!tenantId ? 'Select tenant first' : branchesLoading ? 'Loading branches…' : 'Select branch'}
                label="Branches"
                disabled={!tenantId || branchesLoading}
                searchPlaceholder="Search branches…"
                emptyText="No branches found"
              />
            </div>
            <div className="space-y-2">
              <Label>Terminal Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Front Desk Kiosk" />
            </div>
          </div>

          <Button onClick={create} disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create terminal'}
          </Button>
        </CardContent>
      </Card>

      {createResult && (
        <Card>
          <CardHeader>
            <CardTitle>Secret / Response</CardTitle>
            <CardDescription>Copy the secret immediately; it won’t be shown again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={JSON.stringify(createResult, null, 2)} readOnly className="font-mono h-40" />
          </CardContent>
        </Card>
      )}

      {terminals && (
        <Card>
          <CardHeader>
            <CardTitle>Terminals</CardTitle>
            <CardDescription>{terminals.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>id</TableHead>
                  <TableHead>name</TableHead>
                  <TableHead>branch</TableHead>
                  <TableHead>active</TableHead>
                  <TableHead>lastSeenAt</TableHead>
                  <TableHead>actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminals.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono">{t.id}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">{t.gymId}</div>
                      <div className="text-xs text-muted-foreground">{t.gym?.name || ''}</div>
                    </TableCell>
                    <TableCell>
                      <span className={t.isActive ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {t.isActive ? 'active' : 'inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.lastSeenAt ? new Date(t.lastSeenAt).toLocaleString() : ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => rotateSecret(t.id)}>
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Rotate secret
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(t.id, !t.isActive)}>
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
