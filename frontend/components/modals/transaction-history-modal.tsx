'use client'

import { User } from '@/types'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Receipt, 
  DollarSign, 
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react'
import { useGymMemberTransactions } from '@/lib/hooks/use-gym-subscriptions'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  member: User | null
}

export function TransactionHistoryModal({
  isOpen,
  onClose,
  member
}: TransactionHistoryModalProps) {
  const { data: transactions, isLoading, error } = useGymMemberTransactions(member?.id)
  const [showStats, setShowStats] = useState(false)
  
  if (!member) return null

  const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Unknown'
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'REFUNDED':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />
    }
  }
  
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive'
      case 'PENDING':
        return 'secondary'
      case 'REFUNDED':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'REFUND':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case 'ADJUSTMENT':
        return <Receipt className="h-4 w-4 text-purple-600" />
      default:
        return <DollarSign className="h-4 w-4 text-green-600" />
    }
  }

  const getTotalAmount = () => {
    if (!transactions || !Array.isArray(transactions)) return 0
    return transactions
      .filter(t => t.status === 'COMPLETED' && t.type === 'PAYMENT')
      .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0)
  }

  const getTransactionCount = () => {
    if (!transactions || !Array.isArray(transactions)) return 0
    return transactions.filter(t => t.status === 'COMPLETED').length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] w-[95vw] sm:w-full overflow-y-auto overflow-x-hidden">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Large Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Receipt className="h-8 w-8" />
            </div>
            
            {/* Member Info */}
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">Transaction History</DialogTitle>
              <p className="text-base text-muted-foreground">{memberName}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-1">
          {/* Summary Cards - Collapsible */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Transaction Statistics</span>
              </div>
              {showStats ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {showStats && (
              <div className="grid grid-cols-1 gap-3 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTransactionCount()}</div>
                    <p className="text-xs text-muted-foreground">Completed payments</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">₱{getTotalAmount().toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">All time payments</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ₱{getTransactionCount() > 0 ? Math.round(getTotalAmount() / getTransactionCount()).toLocaleString() : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Per transaction</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading transactions...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Failed to load transaction history. Please try again.
            </div>
          ) : !transactions || !Array.isArray(transactions) || transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This member hasn&apos;t made any payments yet.
              </p>
            </div>
          ) : (
            Array.isArray(transactions) && transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 space-y-3 overflow-hidden">
                {/* Top Row - Transaction Title and Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex-shrink-0">
                      {getTransactionTypeIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Payment Transaction</p>
                      <p className="text-sm text-muted-foreground">{transaction.type}</p>
                    </div>
                    <Badge variant={getStatusVariant(transaction.status)} className="text-xs font-medium">
                      {transaction.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className={`font-bold text-2xl ${
                        transaction.type === 'REFUND' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {transaction.type === 'REFUND' ? '-' : ''}₱{(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">PHP</p>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Row - Transaction Details */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>{transaction.paymentMethod}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusIcon(transaction.status)}
                    <span>Transaction ID: {transaction.id.slice(-8)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} className="min-w-[120px]">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
