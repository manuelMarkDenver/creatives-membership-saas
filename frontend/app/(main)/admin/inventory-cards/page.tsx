'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Crown, CreditCard, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useTenants } from '@/lib/hooks/use-tenants'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { apiClient } from '@/lib/api/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Branch, Tenant } from '@/types'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type InventoryCardStatus = 'AVAILABLE' | 'ASSIGNED' | 'DISABLED'

function normalizeCardUid(rawUid: string): string {
  const cleaned = rawUid.trim().toUpperCase()

  if (cleaned.length >= 8 && /^\d+$/.test(cleaned)) {
    let candidate = cleaned

    if (candidate.length === 20) {
      candidate =
        candidate[2] +
        candidate[3] +
        candidate[4] +
        candidate[6] +
        candidate[8] +
        candidate[10] +
        candidate[12] +
        candidate[14] +
        candidate[16] +
        candidate[18]
    } else {
      if (candidate.length < 10) candidate = candidate.padStart(10, '0')
      else if (candidate.length > 10) candidate = candidate.substring(0, 10)
    }

    if (!candidate.startsWith('000')) {
      const reversed = candidate.split('').reverse().join('')
      if (reversed.startsWith('000')) return reversed
    }

    return candidate
  }

  return cleaned
}

function describeInventoryOutcome(outcome: any) {
  if (!outcome) return null

  if (outcome.action === 'CREATED') {
    return `Added to inventory: ${outcome.uid}`
  }

  if (outcome.action === 'ATTEMPTED_CREATE') {
    return `Tried to add: ${outcome.uid} (may already exist)`
  }

  if (outcome.action === 'SKIPPED') {
    if (outcome.reason === 'ALREADY_IN_INVENTORY_TARGET_BRANCH') {
      return `Already in inventory for this branch: ${outcome.uid} (status: ${outcome.inventory?.status})`
    }
    if (outcome.reason === 'ALREADY_IN_INVENTORY_OTHER_BRANCH') {
      return `Already in inventory for another branch: ${outcome.uid} (branch: ${outcome.inventory?.allocatedGymId}, status: ${outcome.inventory?.status})`
    }
    if (outcome.reason === 'ALREADY_IN_CARDS_TABLE') {
      const assigned = outcome.card?.memberId ? 'assigned' : 'unassigned'
      const active = outcome.card?.active ? 'active' : 'inactive'
      return `Already exists as operational card: ${outcome.uid} (${assigned}, ${active}, branch: ${outcome.card?.gymId})`
    }
    return `Skipped: ${outcome.uid}`
  }

  return null
}

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

  const [autoSaveScans, setAutoSaveScans] = useState(true)
  const [scanInput, setScanInput] = useState('')
  const [scannedUids, setScannedUids] = useState<string[]>([])
  const [scanResult, setScanResult] = useState<any>(null)
  const [isSavingScans, setIsSavingScans] = useState(false)
  const [tapError, setTapError] = useState<string | null>(null)
  const [tapModeOpen, setTapModeOpen] = useState(false)

  const tapInputRef = useRef<HTMLInputElement | null>(null)

  const [statusFilter, setStatusFilter] = useState<InventoryCardStatus>('AVAILABLE')
  const [listResult, setListResult] = useState<any[] | null>(null)
  const [isListing, setIsListing] = useState(false)

  const preview = useMemo(() => uids.slice(0, 20), [uids])
  const scannedPreview = useMemo(() => scannedUids.slice(-10).reverse(), [scannedUids])

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

  const addScannedUid = async (raw: string) => {
    setTapError(null)
    setScanResult(null)

    if (!tenantId.trim() || !branchId.trim()) {
      setTapError('Select tenant and branch first')
      return
    }

    const uid = normalizeCardUid(raw)
    if (!uid) return

    setScannedUids((prev) => (prev.includes(uid) ? prev : [...prev, uid]))

    if (!autoSaveScans) {
      setScanResult({ mode: 'COLLECT', uid })
      return
    }

    setIsSavingScans(true)
    try {
      // Use bulk endpoint even for 1 uid (idempotent via skipDuplicates)
      const res = await apiClient.post('/admin/inventory-cards/bulk', {
        tenantId: tenantId.trim(),
        branchId: branchId.trim(),
        uids: [uid],
        ...(batchId.trim() ? { batchId: batchId.trim() } : {}),
      })
      setScanResult({ mode: 'AUTO_SAVE', uid, result: res.data })
    } catch (e) {
      setTapError((e as any)?.message || 'Failed to save scanned card')
    } finally {
      setIsSavingScans(false)
    }
  }

  const saveAllScans = async () => {
    setTapError(null)
    setScanResult(null)

    if (!tenantId.trim() || !branchId.trim()) {
      setTapError('Select tenant and branch first')
      return
    }

    if (scannedUids.length === 0) {
      setTapError('No scanned UIDs to save')
      return
    }

    setIsSavingScans(true)
    try {
      const res = await apiClient.post('/admin/inventory-cards/bulk', {
        tenantId: tenantId.trim(),
        branchId: branchId.trim(),
        uids: scannedUids,
        ...(batchId.trim() ? { batchId: batchId.trim() } : {}),
      })
      setScanResult({ mode: 'BULK_SAVE', result: res.data })
    } catch (e) {
      setTapError((e as any)?.message || 'Failed to save scanned cards')
    } finally {
      setIsSavingScans(false)
    }
  }

  useEffect(() => {
    if (!tapModeOpen) return

    let focusInterval: ReturnType<typeof setInterval> | null = null

    const focusInput = () => {
      if (tapInputRef.current) {
        tapInputRef.current.focus()
      }
    }

    // Focus immediately
    setTimeout(focusInput, 0)

    // Focus on any click/tap
    const handleClick = () => focusInput()
    document.addEventListener('click', handleClick)

    // Refocus on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) setTimeout(focusInput, 100)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Safety net interval
    focusInterval = setInterval(() => {
      if (tapInputRef.current && document.activeElement !== tapInputRef.current) {
        focusInput()
      }
    }, 3000)

    return () => {
      if (focusInterval) clearInterval(focusInterval)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [tapModeOpen])

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
              <SearchableDropdown
                value={tenantId}
                onValueChange={(v) => {
                  setTenantId(v)
                  setBranchId('')
                  setUploadResult(null)
                  setListResult(null)
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
              <Label>Branch ID</Label>
              <SearchableDropdown
                value={branchId}
                onValueChange={(v) => {
                  setBranchId(v)
                  setUploadResult(null)
                  setListResult(null)
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

      <Card>
        <CardHeader>
          <CardTitle>Manual Tapping</CardTitle>
          <CardDescription>
            Scan cards using an RFID reader that types into an input (keyboard emulation). Use auto-save for consecutive taps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={autoSaveScans} onCheckedChange={setAutoSaveScans} />
              <span className="text-sm">Auto-save each scan</span>
            </div>
            <div className="text-sm text-muted-foreground">Scanned this session: {scannedUids.length}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                if (!tenantId || !branchId) {
                  setTapError('Select tenant and branch first')
                  return
                }
                setTapError(null)
                setTapModeOpen(true)
              }}
              disabled={!tenantId || !branchId}
            >
              Start Tap Mode
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setScannedUids([])
                setScanResult(null)
                setTapError(null)
              }}
              disabled={scannedUids.length === 0}
            >
              Clear session
            </Button>
            <Button
              variant="outline"
              onClick={saveAllScans}
              disabled={autoSaveScans || scannedUids.length === 0 || isSavingScans}
            >
              {isSavingScans ? 'Saving…' : 'Save all'}
            </Button>
          </div>

          {tapError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{tapError}</AlertDescription>
            </Alert>
          )}

          {scannedUids.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground mb-2">Recent scans (last 10)</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {scannedPreview.map((u) => (
                  <div key={u} className="font-mono text-xs truncate">{u}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={tapModeOpen}
        onOpenChange={(open) => {
          setTapModeOpen(open)
          setScanInput('')
          setTapError(null)
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setTimeout(() => tapInputRef.current?.focus(), 0)
          }}
        >
          {/* Hidden input for RFID keyboard emulation - always focused while modal is open */}
          <input
            ref={tapInputRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'NumpadEnter' || e.key === 'Tab') {
                if (e.key === 'Tab') e.preventDefault()
                const raw = scanInput
                setScanInput('')
                void addScannedUid(raw)
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                if (tapModeOpen) tapInputRef.current?.focus()
              }, 10)
            }}
            className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
            autoFocus
            inputMode="none"
            readOnly={false}
          />

          <DialogHeader>
            <DialogTitle>Tap Mode</DialogTitle>
            <DialogDescription>
              Tap cards now. This modal keeps focus on the scan input so you don’t accidentally type into other fields.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  INVENTORY TAP MODE ACTIVE
                </div>
                <div className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
                  Target: tenant={tenantId} branch={branchId}{batchId ? ` batch=${batchId}` : ''}
                </div>
              </div>
              <div className="text-sm text-emerald-900 dark:text-emerald-200">
                Scanned: <span className="font-mono">{scannedUids.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={autoSaveScans} onCheckedChange={setAutoSaveScans} />
              <span className="text-sm">Auto-save each scan</span>
            </div>
            <Button variant="outline" onClick={() => tapInputRef.current?.focus()}>
              Refocus
            </Button>
            <Button
              onClick={saveAllScans}
              disabled={autoSaveScans || scannedUids.length === 0 || isSavingScans}
            >
              {isSavingScans ? 'Saving…' : 'Save all'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setScannedUids([])
                setScanResult(null)
                setTapError(null)
                setScanInput('')
                setTimeout(() => tapInputRef.current?.focus(), 0)
              }}
              disabled={scannedUids.length === 0}
            >
              Clear session
            </Button>
          </div>

          {tapError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{tapError}</AlertDescription>
            </Alert>
          )}

          {scanResult ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground mb-2">Last result</div>
              {scanResult?.result?.outcomes?.[0] ? (
                <div className="mb-3 rounded-md border bg-background p-3 text-sm">
                  {describeInventoryOutcome(scanResult.result.outcomes[0])}
                </div>
              ) : null}
              <div className="text-xs font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(scanResult, null, 2)}
              </div>
            </div>
          ) : null}

          {scannedUids.length > 0 ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground mb-2">Recent scans (last 10)</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {scannedPreview.map((u) => (
                  <div key={u} className="font-mono text-xs truncate">{u}</div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground">
            Tip: You can tap anywhere on the page if focus is lost; Tap Mode will refocus the scanner input.
          </div>
        </DialogContent>
      </Dialog>

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
