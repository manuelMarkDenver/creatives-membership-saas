'use client'

import { useMemo, useState } from 'react'
import { Crown, CreditCard } from 'lucide-react'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { useAssignedInventory, useInventorySummary } from '@/lib/hooks/use-inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Badge } from '@/components/ui/badge'
import type { Branch } from '@/types'

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n)
}

export default function InventoryPage() {
  const { data: profile } = useProfile()
  const tenantId = profile?.tenantId || ''
  const [branchId, setBranchId] = useState<string>('')

  const { data: summary } = useInventorySummary()
  const { data: branchesData } = useBranchesByTenant(tenantId)
  const branches: Branch[] = Array.isArray(branchesData)
    ? branchesData
    : (branchesData as any)?.data || []

  const { data: assigned } = useAssignedInventory({
    branchId: branchId || undefined,
    limit: 200,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Card Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track remaining cards, assigned cards, and usage per branch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <CardDescription>Available inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.available)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CardDescription>Assigned to members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.assignedToMembers)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Cards</CardTitle>
            <CardDescription>Walk-in cards (active)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.dailyCards)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(normalizedTotals.disabled)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Branch</CardTitle>
          <CardDescription>Inventory counts per branch.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assigned Cards
          </CardTitle>
          <CardDescription>
            Shows who each card is assigned to (latest 200).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <SearchableDropdown
              value={branchId || '__ALL__'}
              onValueChange={(v) => setBranchId(v === '__ALL__' ? '' : v)}
              items={branchOptions}
              placeholder="All branches"
              label="Branches"
              searchPlaceholder="Search branches…"
              emptyText="No branches found"
              disabled={!tenantId}
            />
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
                  <TableCell className="font-mono">{row.uid}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
