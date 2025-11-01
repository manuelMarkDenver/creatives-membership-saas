'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Send, AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import { useEmailLogs } from '@/lib/hooks/use-email'
import { format } from 'date-fns'

export function EmailLogsViewer() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [limit, setLimit] = useState(50)

  const { data: logs, isLoading } = useEmailLogs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Logs
        </CardTitle>
        <CardDescription>
          View sent emails and their delivery status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Limit:</label>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.recipientName || log.recipientEmail}</span>
                      <Badge className={getStatusBadge(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.subject} • {log.templateType} • {log.provider}
                    </div>
                    {log.errorMessage && (
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Error: {log.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {log.sentAt ? format(new Date(log.sentAt), 'MMM dd, HH:mm') : 'Not sent'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email logs found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}