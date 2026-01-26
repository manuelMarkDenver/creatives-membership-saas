'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, Download, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-toastify'
import apiClient from '@/lib/api/client'
import { useBranchesByTenant } from '@/lib/hooks/use-branches'
import { useProfile } from '@/lib/hooks/use-gym-users'

interface DailyEntry {
  id: string
  cardUid: string
  occurredAt: string
  amount: number
  status: 'RECORDED' | 'VOIDED'
  voidedAt?: string
  voidReason?: string
  gym: {
    id: string
    name: string
  }
  terminal?: {
    id: string
    name: string
  }
}

interface DailySummary {
  recordedCount: number
  recordedAmountTotal: number
  voidedCount: number
  voidedAmountTotal: number
}

export default function DailyPage() {
  const { data: profile } = useProfile()
  const { data: branchesData, isLoading: isLoadingBranches } = useBranchesByTenant(
    profile?.tenantId || '',
    { includeDeleted: false }
  )
  const branches = branchesData || []
  
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [summary, setSummary] = useState<DailySummary>({
    recordedCount: 0,
    recordedAmountTotal: 0,
    voidedCount: 0,
    voidedAmountTotal: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [showUnvoidDialog, setShowUnvoidDialog] = useState(false)

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (dateRange.from) params.startDate = dateRange.from.toISOString()
      if (dateRange.to) params.endDate = dateRange.to.toISOString()
      if (branchFilter !== 'all') params.branchId = branchFilter
      if (statusFilter !== 'all') params.status = statusFilter
      
      const response = await apiClient.get('/admin/daily-entries', { params })
      const data = response.data
      setEntries(data.entries || [])
      setSummary(data.summary || {
        recordedCount: 0,
        recordedAmountTotal: 0,
        voidedCount: 0,
        voidedAmountTotal: 0
      })
    } catch (error) {
      console.error('Error fetching daily entries:', error)
      toast.error('Failed to load daily entries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [dateRange, branchFilter, statusFilter])

  const handleVoid = async () => {
    if (!selectedEntry) return
    
    try {
      await apiClient.post(`/admin/daily-entries/${selectedEntry.id}/void`, { reason: voidReason })
       
       toast.success('Entry voided successfully')
       
       setShowVoidDialog(false)
       setVoidReason('')
       fetchEntries()
     } catch (error) {
       console.error('Error voiding entry:', error)
       toast.error('Failed to void entry')
     }
   }

  const handleUnvoid = async () => {
    if (!selectedEntry) return
    
    try {
      await apiClient.post(`/admin/daily-entries/${selectedEntry.id}/unvoid`, { reason: voidReason })
       
       toast.success('Entry unvoided successfully')
       
       setShowUnvoidDialog(false)
       setVoidReason('')
       fetchEntries()
     } catch (error) {
       console.error('Error unvoiding entry:', error)
       toast.error('Failed to unvoid entry')
     }
   }

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Date', 'Time', 'Card UID', 'Amount', 'Status', 'Void Reason']
    const csvData = entries.map(entry => [
      format(new Date(entry.occurredAt), 'yyyy-MM-dd'),
      format(new Date(entry.occurredAt), 'HH:mm:ss'),
      entry.cardUid,
      entry.amount,
      entry.status,
      entry.voidReason || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const presetRanges = {
    today: () => {
      const today = new Date()
      const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0))
      const endOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))
      return { from: startOfDay, to: endOfDay }
    },
    thisWeek: () => {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const utcStartOfWeek = new Date(Date.UTC(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 0, 0, 0, 0))
      const utcEndOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))
      return { from: utcStartOfWeek, to: utcEndOfDay }
    },
    thisMonth: () => {
      const today = new Date()
      const utcStartOfMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0))
      const utcEndOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))
      return { from: utcStartOfMonth, to: utcEndOfDay }
    },
    thisYear: () => {
      const today = new Date()
      const utcStartOfYear = new Date(Date.UTC(today.getFullYear(), 0, 1, 0, 0, 0, 0))
      const utcEndOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))
      return { from: utcStartOfYear, to: utcEndOfDay }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Walk-ins</h1>
          <p className="text-muted-foreground">
            Track and manage daily walk-in entries
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="space-y-2">
               <Label>Branch</Label>
               <Select value={branchFilter} onValueChange={setBranchFilter} disabled={isLoadingBranches}>
                 <SelectTrigger>
                   <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select branch"} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Branches</SelectItem>
                   {branches.map((branch: any) => (
                     <SelectItem key={branch.id} value={branch.id}>
                       {branch.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label>Date Range</Label>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <Label htmlFor="date-from" className="text-sm">From</Label>
                   <Input
                     id="date-from"
                     type="date"
                     value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                     onChange={(e) => {
                       const date = e.target.value ? new Date(e.target.value) : undefined
                       setDateRange(prev => ({ ...prev, from: date }))
                     }}
                   />
                 </div>
                 <div>
                   <Label htmlFor="date-to" className="text-sm">To</Label>
                   <Input
                     id="date-to"
                     type="date"
                     value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                     onChange={(e) => {
                       const date = e.target.value ? new Date(e.target.value) : undefined
                       setDateRange(prev => ({ ...prev, to: date }))
                     }}
                   />
                 </div>
               </div>
               <div className="flex flex-wrap gap-2 mt-2">
                 <Button variant="outline" size="sm" onClick={() => setDateRange(presetRanges.today())}>
                   Today
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setDateRange(presetRanges.thisWeek())}>
                   This Week
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setDateRange(presetRanges.thisMonth())}>
                   This Month
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setDateRange(presetRanges.thisYear())}>
                   This Year
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setDateRange({})}>
                   Clear
                 </Button>
               </div>
             </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="RECORDED">Recorded</SelectItem>
                  <SelectItem value="VOIDED">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchEntries} className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Walk-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recordedCount}</div>
            <p className="text-xs text-muted-foreground">
              Recorded entries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{summary.recordedAmountTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total recorded amount
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Voided
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.voidedCount}</div>
            <p className="text-xs text-muted-foreground">
              Voided entries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Voided Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{summary.voidedAmountTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total voided amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Entries</CardTitle>
          <CardDescription>
            {entries.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No entries found for the selected filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Card UID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="font-medium">{format(new Date(entry.occurredAt), 'PPP')}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.occurredAt), 'p')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{entry.cardUid}</TableCell>
                      <TableCell>₱{entry.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'RECORDED' ? 'default' : 'destructive'}>
                          {entry.status === 'RECORDED' ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Recorded
                            </>
                          ) : (
                            <>
                              <X className="mr-1 h-3 w-3" />
                              Voided
                            </>
                          )}
                        </Badge>
                        {entry.voidReason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {entry.voidReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.status === 'RECORDED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEntry(entry)
                              setShowVoidDialog(true)
                            }}
                          >
                            Void
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEntry(entry)
                              setShowUnvoidDialog(true)
                            }}
                          >
                            Unvoid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Void Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to void this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEntry && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Date</Label>
                    <div className="text-sm">{format(new Date(selectedEntry.occurredAt), 'PPP p')}</div>
                  </div>
                  <div>
                    <Label className="text-sm">Amount</Label>
                    <div className="text-sm">₱{selectedEntry.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm">Card UID</Label>
                    <div className="text-sm font-mono">{selectedEntry.cardUid}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for voiding..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleVoid}>
              Void Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unvoid Dialog */}
      <Dialog open={showUnvoidDialog} onOpenChange={setShowUnvoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unvoid Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this entry?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEntry && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Date</Label>
                    <div className="text-sm">{format(new Date(selectedEntry.occurredAt), 'PPP p')}</div>
                  </div>
                  <div>
                    <Label className="text-sm">Amount</Label>
                    <div className="text-sm">₱{selectedEntry.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm">Card UID</Label>
                    <div className="text-sm font-mono">{selectedEntry.cardUid}</div>
                  </div>
                  {selectedEntry.voidReason && (
                    <div className="col-span-2">
                      <Label className="text-sm">Void Reason</Label>
                      <div className="text-sm text-muted-foreground">{selectedEntry.voidReason}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="unvoid-reason">Reason (optional)</Label>
              <Textarea
                id="unvoid-reason"
                placeholder="Enter reason for unvoiding..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnvoidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnvoid}>
              Unvoid Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}