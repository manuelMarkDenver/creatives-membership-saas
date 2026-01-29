'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Crown, CreditCard, Info } from 'lucide-react'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { useAssignedInventory, useAvailableInventory, useInventorySummary } from '@/lib/hooks/use-inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Branch } from '@/types'

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

function maskUid(uid: string, reveal: boolean) {
  if (reveal) return uid
  const last4 = uid.slice(-4)
  return `•••• ${last4}`
}

export default function InventoryPage() {
  const { data: profile } = useProfile()
  const tenantId = profile?.tenantId || ''
  const [branchId, setBranchId] = useState<string>('')
  const [revealUids, setRevealUids] = useState(false)

  const [assignedQ, setAssignedQ] = useState('')
  const [assignedPage, setAssignedPage] = useState(1)

  const [availableQ, setAvailableQ] = useState('')
  const [availablePage, setAvailablePage] = useState(1)

  const pageSize = 25

  const { data: summary } = useInventorySummary({ branchId: branchId || undefined })
  const { data: branchesData } = useBranchesByTenant(tenantId)
  const branches: Branch[] = Array.isArray(branchesData)
    ? branchesData
    : (branchesData as any)?.data || []

  // Default to a real branch (main/first) instead of "All branches" so totals feel correct.
  useEffect(() => {
    if (!tenantId) return
    if (branchId) return
    if (!branches || branches.length === 0) return

    const main = branches.find((b) => b.isMainBranch)
    setBranchId(main?.id || branches[0].id)
  }, [tenantId, branchId, branches])

  const { data: assigned } = useAssignedInventory({
    branchId: branchId || undefined,
    q: assignedQ || undefined,
    page: assignedPage,
    pageSize,
  })

  const { data: available } = useAvailableInventory({
    branchId: branchId || undefined,
    q: availableQ || undefined,
    page: availablePage,
    pageSize,
  })

  const branchOptions = useMemo(
    () => [
      { value: '__ALL__', label: 'All branches' },
      ...branches.map((b) => ({
        value: b.id,
        label: b.name,
        description: b.address || undefined,
      })),
    ],
    [branches],
  )

  if (!profile || (profile.role !== 'OWNER' && profile.role !== 'MANAGER')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You need Owner/Manager privileges to view inventory.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totals = summary?.totals || { total: 0, available: 0, assigned: 0, disabled: 0 }

  const normalizedTotals = {
    total: totals.total ?? 0,
    available: totals.available ?? 0,
    disabled: totals.disabled ?? 0,
    assignedToMembers: totals.assignedToMembers ?? 0,
    dailyCards: totals.dailyCards ?? 0,
    inventoryAssigned: totals.inventoryAssigned ?? 0,
  }

  const [openSection, setOpenSection] = useState<'stats' | 'assigned' | 'available'>('stats')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Card Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track remaining cards, assigned cards, and usage per branch.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Inventory is scoped to the selected branch (or all branches).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="w-[min(520px,100%)]">
            <SearchableDropdown
              value={branchId || '__ALL__'}
              onValueChange={(v) => {
                setBranchId(v === '__ALL__' ? '' : v)
                setAssignedPage(1)
                setAvailablePage(1)
              }}
              items={branchOptions}
              placeholder="All branches"
              label="Branches"
              searchPlaceholder="Search branches…"
              emptyText="No branches found"
              disabled={!tenantId}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={revealUids}
              onChange={(e) => setRevealUids(e.target.checked)}
            />
            Reveal full card numbers
          </label>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5" />
            <div>
              Card numbers are masked by default to reduce shoulder-surfing risk.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Stats</CardTitle>
            <CardDescription>
              High-level counts for the selected branch.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenSection(openSection === 'stats' ? 'assigned' : 'stats')}
          >
            {openSection === 'stats' ? 'Collapse' : 'Expand'}
            <ChevronDown className={
              openSection === 'stats' ? 'ml-2 h-4 w-4 rotate-180' : 'ml-2 h-4 w-4'
            }
            />
          </Button>
        </CardHeader>
        {openSection === 'stats' ? (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <CardDescription>Inventory cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.total)}</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.available)}</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                  <CardDescription>To members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.assignedToMembers)}</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Daily</CardTitle>
                  <CardDescription>Walk-in cards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.dailyCards)}</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.disabled)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border">
              <div className="px-4 py-3 border-b">
                <div className="font-semibold">By Branch</div>
                <div className="text-sm text-muted-foreground">Inventory counts per branch.</div>
              </div>
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead className="text-right">Daily</TableHead>
                      <TableHead className="text-right">Disabled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(summary?.branches || []).map((b: any) => (
                      <TableRow key={b.branchId}>
                        <TableCell className="font-medium">{b.branchName}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.total)}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.available)}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.assignedToMembers || 0)}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.dailyCards || 0)}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.disabled)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assigned Cards
          </CardTitle>
          <CardDescription>
            Search by member name, email, or card number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {formatNumber(assigned?.total ?? 0)} total
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenSection(openSection === 'assigned' ? 'available' : 'assigned')}
            >
              {openSection === 'assigned' ? 'Collapse' : 'Expand'}
              <ChevronDown className={
                openSection === 'assigned' ? 'ml-2 h-4 w-4 rotate-180' : 'ml-2 h-4 w-4'
              }
              />
            </Button>
          </div>

          {openSection === 'assigned' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-[min(420px,100%)]">
                  <Input
                    value={assignedQ}
                    onChange={(e) => {
                      setAssignedQ(e.target.value)
                      setAssignedPage(1)
                    }}
                    placeholder="Search member, email, or card…"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(assigned?.items || []).map((row: any) => (
                    <TableRow key={row.uid}>
                      <TableCell className="font-medium">{row.memberName || 'Unknown'}</TableCell>
                      <TableCell>{row.branchName || row.branchId}</TableCell>
                      <TableCell className="font-mono">{maskUid(row.uid, revealUids)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={row.active ? 'default' : 'secondary'}>
                            {row.active ? 'active' : 'inactive'}
                          </Badge>
                          <Badge variant="outline">{row.type}</Badge>
                          {row.inventory?.status ? (
                            <Badge variant="outline">inv:{row.inventory.status}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setAssignedPage((p) => Math.max(1, p - 1))}
                  disabled={assignedPage <= 1}
                >
                  Prev
                </Button>
                <div className="text-sm text-muted-foreground">Page {assignedPage}</div>
                <Button
                  variant="outline"
                  onClick={() => setAssignedPage((p) => p + 1)}
                  disabled={!assigned?.total || assignedPage * pageSize >= (assigned?.total ?? 0)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Cards</CardTitle>
          <CardDescription>
            Cards you still have in stock (AVAILABLE). Search by card number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {formatNumber(available?.total ?? 0)} total
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenSection(openSection === 'available' ? 'stats' : 'available')}
            >
              {openSection === 'available' ? 'Collapse' : 'Expand'}
              <ChevronDown className={
                openSection === 'available' ? 'ml-2 h-4 w-4 rotate-180' : 'ml-2 h-4 w-4'
              }
              />
            </Button>
          </div>

          {openSection === 'available' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-[min(420px,100%)]">
                  <Input
                    value={availableQ}
                    onChange={(e) => {
                      setAvailableQ(e.target.value)
                      setAvailablePage(1)
                    }}
                    placeholder="Search card number…"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(available?.items || []).map((row: any) => (
                    <TableRow key={row.uid}>
                      <TableCell className="font-mono">{maskUid(row.uid, revealUids)}</TableCell>
                      <TableCell>{row.branchName || row.branchId}</TableCell>
                      <TableCell className="font-mono text-xs">{row.batchId || ''}</TableCell>
                      <TableCell>
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setAvailablePage((p) => Math.max(1, p - 1))}
                  disabled={availablePage <= 1}
                >
                  Prev
                </Button>
                <div className="text-sm text-muted-foreground">Page {availablePage}</div>
                <Button
                  variant="outline"
                  onClick={() => setAvailablePage((p) => p + 1)}
                  disabled={!available?.total || availablePage * pageSize >= (available?.total ?? 0)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
