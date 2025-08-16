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
  RotateCcw
} from 'lucide-react'
import { useGymMemberTransactions } from '@/lib/hooks/use-gym-subscriptions'

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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <p className="text-sm text-muted-foreground">{memberName}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            View all payment transactions and subscription history for this member.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                This member hasn't made any payments yet.
              </p>
            </div>
          ) : (
            Array.isArray(transactions) && transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {getTransactionTypeIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Payment Transaction</p>
                      <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {transaction.paymentMethod}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getStatusIcon(transaction.status)}
                        {transaction.type}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'REFUND' 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {transaction.type === 'REFUND' ? '-' : ''}₱{(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">PHP</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
