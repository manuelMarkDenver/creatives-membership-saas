'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Crown, CreditCard, Upload } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Branch, Tenant } from '@/types'

type InventoryCardStatus = 'AVAILABLE' | 'ASSIGNED' | 'DISABLED'

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }

    cur += ch
  }

  out.push(cur)
  return out.map((v) => v.trim())
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase()
}

export default function AdminInventoryCardsPage() {
  const { data: profile } = useProfile()
  const [tenantId, setTenantId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [rawCsv, setRawCsv] = useState('')
  const [uids, setUids] = useState<string[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const [statusFilter, setStatusFilter] = useState<InventoryCardStatus>('AVAILABLE')
  const [listResult, setListResult] = useState<any[] | null>(null)
  const [isListing, setIsListing] = useState(false)

  const preview = useMemo(() => uids.slice(0, 20), [uids])

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

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>You need Super Admin privileges to manage card inventory.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const parseCsv = (csvText: string) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length < 2) {
      throw new Error('CSV must include a header row and at least 1 data row')
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader)
    const uidIdx = headers.indexOf('uid')
    const cardUidIdx = headers.indexOf('carduid')
    const idx = uidIdx !== -1 ? uidIdx : cardUidIdx

    if (idx === -1) {
      throw new Error('Missing required header. Use: uid (or cardUid).')
    }

    const parsed: string[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      const uid = (cols[idx] || '').trim()
      if (uid) parsed.push(uid)
    }

    return Array.from(new Set(parsed))
  }

  const onSelectFile = async (file: File | null) => {
    setUploadResult(null)
    setParseError(null)
    setUids([])
    setRawCsv('')

    if (!file) return
    const text = await file.text()
    setRawCsv(text)
    try {
      setUids(parseCsv(text))
    } catch (e) {
      setParseError((e as Error).message)
    }
  }

  const onUpload = async () => {
    setUploadResult(null)
    setParseError(null)

    if (!tenantId.trim() || !branchId.trim()) {
      setParseError('tenantId and branchId are required')
      return
    }

    if (uids.length === 0) {
      setParseError('No parsed uids to upload')
      return
    }

    setIsUploading(true)
    try {
      const res = await apiClient.post('/admin/inventory-cards/bulk', {
        tenantId: tenantId.trim(),
        branchId: branchId.trim(),
        uids,
        ...(batchId.trim() ? { batchId: batchId.trim() } : {}),
      })
      setUploadResult(res.data)
    } catch (e) {
      setParseError((e as any)?.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const onList = async () => {
    setListResult(null)
    setParseError(null)

    if (!tenantId.trim() || !branchId.trim()) {
      setParseError('tenantId and branchId are required')
      return
    }

    setIsListing(true)
    try {
      const params: any = {
        tenantId: tenantId.trim(),
        branchId: branchId.trim(),
        status: statusFilter,
        limit: '200',
      }
      if (batchId.trim()) params.batchId = batchId.trim()
      const res = await apiClient.get('/admin/inventory-cards', { params })
      setListResult(res.data)
    } catch (e) {
      setParseError((e as any)?.message || 'List failed')
    } finally {
      setIsListing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Card Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Bulk upload card UIDs into inventory for a specific tenant + branch.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>
            Upload inventory cards only (assignment still happens via the existing kiosk tap flow).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Select
                value={tenantId}
                onValueChange={(v) => {
                  setTenantId(v)
                  setBranchId('')
                  setUploadResult(null)
                  setListResult(null)
                }}
              >
                <SelectTrigger disabled={tenantsLoading}>
                  <SelectValue placeholder={tenantsLoading ? 'Loading tenants…' : 'Select tenant'} />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch ID</Label>
              <Select
                value={branchId}
                onValueChange={(v) => {
                  setBranchId(v)
                  setUploadResult(null)
                  setListResult(null)
                }}
              >
                <SelectTrigger disabled={!tenantId || branchesLoading}>
                  <SelectValue
                    placeholder={!tenantId ? 'Select tenant first' : branchesLoading ? 'Loading branches…' : 'Select branch'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch ID (optional)</Label>
              <Input
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g. 2026-01-setup-01"
              />
              <p className="text-xs text-muted-foreground">
                Useful for bulk disable/move operations.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CSV File</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">Required header: `uid` (or `cardUid`).</p>
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Can’t parse/upload</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onUpload} disabled={isUploading || uids.length === 0}>
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading…' : `Upload (${uids.length})`}
            </Button>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as InventoryCardStatus)}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                  <SelectItem value="ASSIGNED">ASSIGNED</SelectItem>
                  <SelectItem value="DISABLED">DISABLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={onList} disabled={isListing}>
              <CreditCard className="h-4 w-4 mr-2" />
              {isListing ? 'Loading…' : `List ${statusFilter}`}
            </Button>

            <div className="text-sm text-muted-foreground">
              {uids.length > 0 ? `Parsed ${uids.length} UIDs.` : 'No UIDs parsed yet.'}
            </div>
          </div>

          {uids.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground mb-2">Preview (first 20)</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {preview.map((u) => (
                  <div key={u} className="font-mono text-xs truncate">{u}</div>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">Raw CSV loaded: {rawCsv ? 'yes' : 'no'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={JSON.stringify(uploadResult, null, 2)} readOnly className="font-mono h-40" />
          </CardContent>
        </Card>
      )}

      {listResult && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>{listResult.length} cards</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>uid</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead>batchId</TableHead>
                  <TableHead>createdAt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listResult.map((c: any) => (
                  <TableRow key={c.uid}>
                    <TableCell className="font-mono">{c.uid}</TableCell>
                    <TableCell>{c.status}</TableCell>
                    <TableCell>{c.batchId || ''}</TableCell>
                    <TableCell>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
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
