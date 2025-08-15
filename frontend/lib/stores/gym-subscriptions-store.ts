import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { gymSubscriptionsApi, GymSubscriptionStats, GymSubscriptionResponse } from '../api/gym-subscriptions'

export interface GymMember {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phoneNumber?: string
  isActive: boolean
}

export interface GymSubscription {
  id: string
  customerId: string
  membershipPlanId: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
  startDate: string
  endDate: string
  price: number
  currency: string
  membershipPlan: {
    id: string
    name: string
    price: number
    duration: number
    type: string
  }
  customer: GymMember
}

export interface GymTransaction {
  id: string
  amount: number
  type: string
  status: string
  paymentMethod: string
  createdAt: string
}

interface GymSubscriptionsStore {
  // Data State
  subscriptionStats: GymSubscriptionStats | null
  currentSubscriptions: Map<string, GymSubscription>
  memberTransactions: Map<string, GymTransaction[]>
  subscriptionHistory: Map<string, GymSubscription[]>
  
  // Loading States
  isLoadingStats: boolean
  isLoadingSubscription: boolean
  isLoadingTransactions: boolean
  isLoadingHistory: boolean
  isProcessingRenewal: boolean
  isProcessingCancellation: boolean
  
  // Error States
  statsError: string | null
  subscriptionError: string | null
  transactionsError: string | null
  historyError: string | null
  renewalError: string | null
  cancellationError: string | null
  
  // Actions
  loadSubscriptionStats: () => Promise<void>
  loadCurrentSubscription: (memberId: string) => Promise<void>
  loadMemberTransactions: (memberId: string) => Promise<void>
  loadSubscriptionHistory: (memberId: string) => Promise<void>
  renewMembership: (memberId: string, membershipPlanId: string, paymentMethod: string) => Promise<GymSubscriptionResponse | null>
  cancelMembership: (memberId: string, reason?: string, notes?: string) => Promise<GymSubscriptionResponse | null>
  
  // Getters
  getCurrentSubscription: (memberId: string) => GymSubscription | null
  getMemberTransactions: (memberId: string) => GymTransaction[] | null
  getSubscriptionHistory: (memberId: string) => GymSubscription[] | null
  
  // Reset
  reset: () => void
  clearMemberData: (memberId: string) => void
}

const initialState = {
  subscriptionStats: null,
  currentSubscriptions: new Map<string, GymSubscription>(),
  memberTransactions: new Map<string, GymTransaction[]>(),
  subscriptionHistory: new Map<string, GymSubscription[]>(),
  isLoadingStats: false,
  isLoadingSubscription: false,
  isLoadingTransactions: false,
  isLoadingHistory: false,
  isProcessingRenewal: false,
  isProcessingCancellation: false,
  statsError: null,
  subscriptionError: null,
  transactionsError: null,
  historyError: null,
  renewalError: null,
  cancellationError: null,
}

export const useGymSubscriptionsStore = create<GymSubscriptionsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Load subscription stats
      loadSubscriptionStats: async () => {
        set({ isLoadingStats: true, statsError: null })
        try {
          const stats = await gymSubscriptionsApi.getSubscriptionStats()
          set({ subscriptionStats: stats, isLoadingStats: false })
        } catch (error) {
          set({ 
            statsError: error instanceof Error ? error.message : 'Failed to load subscription stats',
            isLoadingStats: false 
          })
        }
      },
      
      // Load current subscription for a member
      loadCurrentSubscription: async (memberId: string) => {
        set({ isLoadingSubscription: true, subscriptionError: null })
        try {
          const subscription = await gymSubscriptionsApi.getCurrentSubscription(memberId)
          const { currentSubscriptions } = get()
          const newSubscriptions = new Map(currentSubscriptions)
          newSubscriptions.set(memberId, subscription)
          set({ 
            currentSubscriptions: newSubscriptions,
            isLoadingSubscription: false 
          })
        } catch (error) {
          set({ 
            subscriptionError: error instanceof Error ? error.message : 'Failed to load subscription',
            isLoadingSubscription: false 
          })
        }
      },
      
      // Load member transactions
      loadMemberTransactions: async (memberId: string) => {
        set({ isLoadingTransactions: true, transactionsError: null })
        try {
          const transactions = await gymSubscriptionsApi.getMemberTransactions(memberId)
          const { memberTransactions } = get()
          const newTransactions = new Map(memberTransactions)
          newTransactions.set(memberId, transactions)
          set({ 
            memberTransactions: newTransactions,
            isLoadingTransactions: false 
          })
        } catch (error) {
          set({ 
            transactionsError: error instanceof Error ? error.message : 'Failed to load transactions',
            isLoadingTransactions: false 
          })
        }
      },
      
      // Load subscription history
      loadSubscriptionHistory: async (memberId: string) => {
        set({ isLoadingHistory: true, historyError: null })
        try {
          const history = await gymSubscriptionsApi.getSubscriptionHistory(memberId)
          const { subscriptionHistory } = get()
          const newHistory = new Map(subscriptionHistory)
          newHistory.set(memberId, history)
          set({ 
            subscriptionHistory: newHistory,
            isLoadingHistory: false 
          })
        } catch (error) {
          set({ 
            historyError: error instanceof Error ? error.message : 'Failed to load subscription history',
            isLoadingHistory: false 
          })
        }
      },
      
      // Renew membership
      renewMembership: async (memberId: string, membershipPlanId: string, paymentMethod: string) => {
        set({ isProcessingRenewal: true, renewalError: null })
        try {
          const response = await gymSubscriptionsApi.renewMembership(memberId, {
            membershipPlanId,
            paymentMethod
          })
          
          // Update current subscription if provided
          if (response.subscription) {
            const { currentSubscriptions } = get()
            const newSubscriptions = new Map(currentSubscriptions)
            newSubscriptions.set(memberId, response.subscription as GymSubscription)
            set({ currentSubscriptions: newSubscriptions })
          }
          
          set({ isProcessingRenewal: false })
          return response
        } catch (error) {
          set({ 
            renewalError: error instanceof Error ? error.message : 'Failed to renew membership',
            isProcessingRenewal: false 
          })
          return null
        }
      },
      
      // Cancel membership
      cancelMembership: async (memberId: string, reason?: string, notes?: string) => {
        set({ isProcessingCancellation: true, cancellationError: null })
        try {
          const response = await gymSubscriptionsApi.cancelMembership(memberId, {
            cancellationReason: reason,
            cancellationNotes: notes
          })
          
          // Update current subscription if provided
          if (response.subscription) {
            const { currentSubscriptions } = get()
            const newSubscriptions = new Map(currentSubscriptions)
            newSubscriptions.set(memberId, response.subscription as GymSubscription)
            set({ currentSubscriptions: newSubscriptions })
          }
          
          set({ isProcessingCancellation: false })
          return response
        } catch (error) {
          set({ 
            cancellationError: error instanceof Error ? error.message : 'Failed to cancel membership',
            isProcessingCancellation: false 
          })
          return null
        }
      },
      
      // Getters
      getCurrentSubscription: (memberId: string) => {
        const { currentSubscriptions } = get()
        return currentSubscriptions.get(memberId) || null
      },
      
      getMemberTransactions: (memberId: string) => {
        const { memberTransactions } = get()
        return memberTransactions.get(memberId) || null
      },
      
      getSubscriptionHistory: (memberId: string) => {
        const { subscriptionHistory } = get()
        return subscriptionHistory.get(memberId) || null
      },
      
      // Clear specific member data
      clearMemberData: (memberId: string) => {
        const { currentSubscriptions, memberTransactions, subscriptionHistory } = get()
        
        const newSubscriptions = new Map(currentSubscriptions)
        const newTransactions = new Map(memberTransactions)
        const newHistory = new Map(subscriptionHistory)
        
        newSubscriptions.delete(memberId)
        newTransactions.delete(memberId)
        newHistory.delete(memberId)
        
        set({
          currentSubscriptions: newSubscriptions,
          memberTransactions: newTransactions,
          subscriptionHistory: newHistory
        })
      },
      
      // Reset
      reset: () => set(initialState),
    }),
    { name: 'GymSubscriptionsStore' }
  )
)
