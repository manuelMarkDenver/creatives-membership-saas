'use client'

import { useMemo, useState } from 'react'
import { Crown, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { apiClient } from '@/lib/api/client'

type ParsedRow = {
  externalMemberId: string
  firstName: string
  lastName: string
  email?: string
  phoneNumber?: string
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

export default function AdminMemberImportPage() {
  const { data: profile } = useProfile()
  const [tenantId, setTenantId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [rawCsv, setRawCsv] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const preview = useMemo(() => rows.slice(0, 10), [rows])

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return (
      <div className="text-center py-12">
        <Crown className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You need Super Admin privileges to import members.
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

    const idx = (name: string) => headers.indexOf(name)
    const externalMemberIdIdx = idx('externalmemberid')
    const firstNameIdx = idx('firstname')
    const lastNameIdx = idx('lastname')
    const emailIdx = idx('email')
    const phoneIdx = idx('phonenumber')

    if (externalMemberIdIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
      throw new Error(
        'Missing required headers. Required: externalMemberId, firstName, lastName. Optional: email, phoneNumber.',
      )
    }

    const parsed: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      const externalMemberId = (cols[externalMemberIdIdx] || '').trim()
      const firstName = (cols[firstNameIdx] || '').trim()
      const lastName = (cols[lastNameIdx] || '').trim()
      const email = emailIdx !== -1 ? (cols[emailIdx] || '').trim() : ''
      const phoneNumber = phoneIdx !== -1 ? (cols[phoneIdx] || '').trim() : ''

      parsed.push({
        externalMemberId,
        firstName,
        lastName,
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
      })
    }

    return parsed
  }

  const onSelectFile = async (file: File | null) => {
    setImportResult(null)
    setParseError(null)
    setRows([])
    setRawCsv('')

    if (!file) return

    const text = await file.text()
    setRawCsv(text)
    try {
      setRows(parseCsv(text))
    } catch (e) {
      setParseError((e as Error).message)
    }
  }

  const onImport = async () => {
    setImportResult(null)
    setParseError(null)

    if (!tenantId.trim() || !branchId.trim()) {
      setParseError('tenantId and branchId are required')
      return
    }

    if (rows.length === 0) {
      setParseError('No parsed rows to import')
      return
    }

    setIsImporting(true)
    try {
      const res = await apiClient.post('/admin/members/import', {
        tenantId: tenantId.trim(),
        branchId: branchId.trim(),
        members: rows,
      })
      setImportResult(res.data)
    } catch (e) {
      setParseError((e as any)?.message || 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Member Import</h1>
          <p className="text-sm text-gray-500">
            Upload a CSV and import members into a specific tenant + branch.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>tenantId</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="UUID" />
          </div>
          <div className="space-y-2">
            <Label>branchId</Label>
            <Input value={branchId} onChange={(e) => setBranchId(e.target.value)} placeholder="UUID" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>CSV file</Label>
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-gray-500">
            Required headers: externalMemberId, firstName, lastName. Optional: email, phoneNumber.
          </p>
        </div>

        {parseError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{parseError}</div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={onImport} disabled={isImporting || rows.length === 0}>
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing…' : `Import (${rows.length})`}
          </Button>
          <div className="text-sm text-gray-600">
            {rows.length > 0 ? `Parsed ${rows.length} rows.` : 'No rows parsed yet.'}
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-lg border bg-white p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview (first 10)</h2>
            <div className="text-xs text-gray-500">Raw CSV loaded: {rawCsv ? 'yes' : 'no'}</div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">externalMemberId</th>
                  <th className="text-left py-2 pr-4">firstName</th>
                  <th className="text-left py-2 pr-4">lastName</th>
                  <th className="text-left py-2 pr-4">email</th>
                  <th className="text-left py-2 pr-4">phoneNumber</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={`${r.externalMemberId}-${i}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-mono">{r.externalMemberId}</td>
                    <td className="py-2 pr-4">{r.firstName}</td>
                    <td className="py-2 pr-4">{r.lastName}</td>
                    <td className="py-2 pr-4">{r.email || ''}</td>
                    <td className="py-2 pr-4">{r.phoneNumber || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="rounded-lg border bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold">Import Result</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total</div>
              <div className="font-semibold">{importResult?.summary?.total ?? '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Created</div>
              <div className="font-semibold">{importResult?.summary?.created ?? '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Updated</div>
              <div className="font-semibold">{importResult?.summary?.updated ?? '-'}</div>
            </div>
            <div>
              <div className="text-gray-500">Failed</div>
              <div className="font-semibold">{importResult?.summary?.failed ?? '-'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Raw response</Label>
            <Textarea value={JSON.stringify(importResult, null, 2)} readOnly className="font-mono h-64" />
          </div>
        </div>
      )}
    </div>
  )
}
