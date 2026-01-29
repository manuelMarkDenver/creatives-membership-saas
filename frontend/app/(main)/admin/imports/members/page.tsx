'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Crown, Upload } from 'lucide-react'
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
          <CardDescription>You need Super Admin privileges to import members.</CardDescription>
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Member Import</h1>
        <p className="text-sm text-muted-foreground">
          Bulk import members to a specific tenant + branch (no card assignment).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target</CardTitle>
          <CardDescription>
            Use the IDs from your existing admin pages (Tenant ID from `Tenants`, Branch ID from `Branches`).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Select
                value={tenantId}
                onValueChange={(v) => {
                  setTenantId(v)
                  setBranchId('')
                  setImportResult(null)
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
              <p className="text-xs text-muted-foreground">Required. Used to scope `externalMemberId` uniqueness.</p>
            </div>
            <div className="space-y-2">
              <Label>Branch ID</Label>
              <Select
                value={branchId}
                onValueChange={(v) => {
                  setBranchId(v)
                  setImportResult(null)
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
              <p className="text-xs text-muted-foreground">Required. Members get this as their primary branch.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CSV File</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Required headers: `externalMemberId`, `firstName`, `lastName`. Optional: `email`, `phoneNumber`.
            </p>
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Can’t parse/import</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onImport} disabled={isImporting || rows.length === 0}>
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing…' : `Import (${rows.length})`}
            </Button>
            <div className="text-sm text-muted-foreground">
              {rows.length > 0 ? `Parsed ${rows.length} rows.` : 'No rows parsed yet.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              First 10 rows. Raw CSV loaded: {rawCsv ? 'yes' : 'no'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>externalMemberId</TableHead>
                  <TableHead>firstName</TableHead>
                  <TableHead>lastName</TableHead>
                  <TableHead>email</TableHead>
                  <TableHead>phoneNumber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((r, i) => (
                  <TableRow key={`${r.externalMemberId}-${i}`}>
                    <TableCell className="font-mono">{r.externalMemberId}</TableCell>
                    <TableCell>{r.firstName}</TableCell>
                    <TableCell>{r.lastName}</TableCell>
                    <TableCell>{r.email || ''}</TableCell>
                    <TableCell>{r.phoneNumber || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Result</CardTitle>
            <CardDescription>Row-level success/failure summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold">{importResult?.summary?.total ?? '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="font-semibold">{importResult?.summary?.created ?? '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Updated</div>
                <div className="font-semibold">{importResult?.summary?.updated ?? '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Failed</div>
                <div className="font-semibold">{importResult?.summary?.failed ?? '-'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Raw Response</Label>
              <Textarea value={JSON.stringify(importResult, null, 2)} readOnly className="font-mono h-64" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
