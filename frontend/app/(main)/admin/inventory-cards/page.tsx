'use client'

import { useMemo, useState } from 'react'
import { Crown, CreditCard, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { apiClient } from '@/lib/api/client'

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

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-12">
        <Crown className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need Super Admin privileges to manage card inventory.
        </p>
      </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Card Inventory</h1>
          <p className="text-sm text-gray-500">
            Bulk upload card UIDs into inventory for a specific tenant + branch.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>tenantId</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="space-y-2">
            <Label>branchId</Label>
            <Input value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="space-y-2">
            <Label>batchId (optional)</Label>
            <Input value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="e.g. 2026-01-setup-01" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>CSV file</Label>
          <Input type="file" accept=".csv,text/csv" onChange={(e) => onSelectFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-gray-500">Required header: uid (or cardUid).</p>
        </div>

        {parseError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{parseError}</div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onUpload} disabled={isUploading || uids.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading…' : `Upload (${uids.length})`}
          </Button>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InventoryCardStatus)}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>

          <Button variant="outline" onClick={onList} disabled={isListing}>
            <CreditCard className="h-4 w-4 mr-2" />
            {isListing ? 'Loading…' : `List ${statusFilter}`}
          </Button>
          <div className="text-sm text-gray-600">
            {uids.length > 0 ? `Parsed ${uids.length} UIDs.` : 'No UIDs parsed yet.'}
          </div>
        </div>

        {uids.length > 0 && (
          <div className="rounded-md border bg-gray-50 p-3">
            <div className="text-xs text-gray-500 mb-2">Preview (first 20)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {preview.map((u) => (
                <div key={u} className="font-mono text-xs truncate">{u}</div>
              ))}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">Raw CSV loaded: {rawCsv ? 'yes' : 'no'}</div>
          </div>
        )}
      </div>

      {uploadResult && (
        <div className="rounded-lg border bg-white p-6 space-y-2">
          <h2 className="text-lg font-semibold">Upload Result</h2>
          <Textarea value={JSON.stringify(uploadResult, null, 2)} readOnly className="font-mono h-40" />
        </div>
      )}

      {listResult && (
        <div className="rounded-lg border bg-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Inventory List</h2>
            <div className="text-sm text-gray-600">{listResult.length} cards</div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">uid</th>
                  <th className="text-left py-2 pr-4">status</th>
                  <th className="text-left py-2 pr-4">batchId</th>
                  <th className="text-left py-2 pr-4">createdAt</th>
                </tr>
              </thead>
              <tbody>
                {listResult.map((c: any) => (
                  <tr key={c.uid} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-mono">{c.uid}</td>
                    <td className="py-2 pr-4">{c.status}</td>
                    <td className="py-2 pr-4">{c.batchId || ''}</td>
                    <td className="py-2 pr-4">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</td>
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
