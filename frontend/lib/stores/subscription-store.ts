import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
export type MemberStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED'

export interface CustomerSubscription {
  id: string
  customerId: string
  membershipPlanId: string
  status: SubscriptionStatus
  startDate: string
  endDate: string
  price: number
  cancelledAt?: string
  createdAt?: string
}

export interface MemberData {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  isActive: boolean
  customerSubscriptions?: CustomerSubscription[]
}

export interface SubscriptionStats {
  totalMembers: number
  activeMembers: number
  expiringMembers: number
  expiredMembers: number
  cancelledMembers: number
}

export interface ExpiringMember {
  id: string
  email: string
  firstName: string
  lastName: string
  endDate: string
  daysRemaining: number
  status: MemberStatus
}

interface SubscriptionStore {
  // Data State
  members: MemberData[]
  subscriptionStats: SubscriptionStats | null
  expiringMembers: ExpiringMember[]
  
  // Loading States
  isLoadingMembers: boolean
  isLoadingStats: boolean
  isLoadingExpiring: boolean
  
  // Error States
  membersError: string | null
  statsError: string | null
  expiringError: string | null
  
  // Cached Calculations (to prevent re-computation)
  memberStatusCache: Map<string, MemberStatus>
  lastCalculated: number
  
  // Actions
  setMembers: (members: MemberData[]) => void
  setSubscriptionStats: (stats: SubscriptionStats) => void
  setExpiringMembers: (expiring: ExpiringMember[]) => void
  
  // Loading Actions
  setLoadingMembers: (loading: boolean) => void
  setLoadingStats: (loading: boolean) => void
  setLoadingExpiring: (loading: boolean) => void
  
  // Error Actions
  setMembersError: (error: string | null) => void
  setStatsError: (error: string | null) => void
  setExpiringError: (error: string | null) => void
  
  // Computed States (cached)
  getMemberStatus: (memberId: string) => MemberStatus | null
  getFilteredMembers: (status: MemberStatus) => MemberData[]
  refreshMemberStatusCache: () => void
  
  // Reset
  reset: () => void
}

const initialState = {
  members: [],
  subscriptionStats: null,
  expiringMembers: [],
  isLoadingMembers: false,
  isLoadingStats: false,
  isLoadingExpiring: false,
  membersError: null,
  statsError: null,
  expiringError: null,
  memberStatusCache: new Map<string, MemberStatus>(),
  lastCalculated: 0,
}

// Helper function to calculate member status (moved here to prevent re-computation)
function calculateMemberStatus(member: MemberData): MemberStatus {
  if (!member.customerSubscriptions || member.customerSubscriptions.length === 0) {
    return 'EXPIRED'
  }

  // Sort subscriptions by creation date (most recent first), then by end date (latest first)
  const subscriptions = [...member.customerSubscriptions]
    .sort((a, b) => {
      const aCreated = new Date(a.createdAt || a.startDate).getTime()
      const bCreated = new Date(b.createdAt || b.startDate).getTime()
      if (aCreated !== bCreated) return bCreated - aCreated
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    })

  const subscription = subscriptions[0] // Most recent subscription

  if (!subscription) return 'EXPIRED'

  // Check if cancelled
  if (subscription.cancelledAt) {
    return 'CANCELLED'
  }

  const now = new Date()
  const endDate = new Date(subscription.endDate)
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Expired (more than 0 days past end date)
  if (daysUntilExpiry < 0) {
    return 'EXPIRED'
  }

  // Expiring (within 7 days of end date)
  if (daysUntilExpiry <= 7) {
    return 'EXPIRING'
  }

  // Active (more than 7 days remaining)
  return 'ACTIVE'
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Actions
      setMembers: (members) => {
        set({ members })
        // Refresh cache when members change
        get().refreshMemberStatusCache()
      },
      
      setSubscriptionStats: (subscriptionStats) => set({ subscriptionStats }),
      setExpiringMembers: (expiringMembers) => set({ expiringMembers }),
      
      // Loading Actions
      setLoadingMembers: (isLoadingMembers) => set({ isLoadingMembers }),
      setLoadingStats: (isLoadingStats) => set({ isLoadingStats }),
      setLoadingExpiring: (isLoadingExpiring) => set({ isLoadingExpiring }),
      
      // Error Actions
      setMembersError: (membersError) => set({ membersError }),
      setStatsError: (statsError) => set({ statsError }),
      setExpiringError: (expiringError) => set({ expiringError }),
      
      // Computed States (cached to prevent re-renders)
      getMemberStatus: (memberId: string) => {
        const { memberStatusCache } = get()
        return memberStatusCache.get(memberId) || null
      },
      
      getFilteredMembers: (status: MemberStatus) => {
        const { members, memberStatusCache } = get()
        return members.filter(member => memberStatusCache.get(member.id) === status)
      },
      
      refreshMemberStatusCache: () => {
        const { members } = get()
        const newCache = new Map<string, MemberStatus>()
        
        members.forEach(member => {
          const status = calculateMemberStatus(member)
          newCache.set(member.id, status)
        })
        
        set({ 
          memberStatusCache: newCache,
          lastCalculated: Date.now()
        })
      },
      
      // Reset
      reset: () => set(initialState),
    }),
    { name: 'SubscriptionStore' }
  )
)
