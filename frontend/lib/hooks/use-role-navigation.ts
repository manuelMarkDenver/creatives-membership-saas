import { useMemo } from 'react'
import { 
  Building2, 
  Users, 
  MapPin, 
  CreditCard,
  BarChart3,
  Settings,
  UserPlus,
  Calendar,
  Crown,
  Shield
} from 'lucide-react'
import { Role } from '@/types'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
  description?: string
  isFutureFeature?: boolean
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  // Super Admin only
  {
    name: 'All Tenants',
    href: '/tenants',
    icon: Crown,
    roles: ['SUPER_ADMIN'],
    description: 'Manage all gym tenants'
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Shield,
    roles: ['SUPER_ADMIN'],
    description: 'System-wide configuration',
    isFutureFeature: true
  },

  // Dashboard - Available to all authenticated users
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'GYM_MEMBER'],
    description: 'Overview and analytics'
  },

  // Branch Management
  {
    name: 'Branches',
    href: '/branches',
    icon: MapPin,
    roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER'],
    description: 'Manage gym locations'
  },

  // User Management
  {
    name: 'Members',
    href: '/members',
    icon: Users,
    roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF'],
    description: 'Manage gym members'
  },
  {
    name: 'Staff',
    href: '/staff',
    icon: UserPlus,
    roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER'],
    description: 'Manage staff members'
  },

  // Subscriptions & Billing
  {
    name: 'Subscription',
    href: '/subscription',
    icon: CreditCard,
    roles: ['SUPER_ADMIN', 'OWNER'],
    description: 'Billing and subscription status'
  },
  {
    name: 'Member Subscriptions',
    href: '/member-subscriptions',
    icon: Calendar,
    roles: ['OWNER', 'MANAGER', 'STAFF'],
    description: 'Manage gym membership plans'
  },

  // Member-specific
  {
    name: 'My Membership',
    href: '/my-membership',
    icon: Calendar,
    roles: ['GYM_MEMBER'],
    description: 'Your membership details'
  },

  // Settings - Role-specific access
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'GYM_MEMBER'],
    description: 'Account and preferences',
    isFutureFeature: true
  },
]

export function useRoleNavigation(userRole?: Role) {
  const navigation = useMemo(() => {
    if (!userRole) return []
    
    return NAVIGATION_ITEMS.filter(item => 
      item.roles.includes(userRole)
    )
  }, [userRole])

  const getDefaultRoute = useMemo(() => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return '/tenants'
      case 'OWNER':
        return '/dashboard'
      case 'MANAGER':
        return '/branches'
      case 'STAFF':
        return '/members'
      case 'GYM_MEMBER':
        return '/my-membership'
      default:
        return '/dashboard'
    }
  }, [userRole])

  return {
    navigation,
    defaultRoute: getDefaultRoute,
    canAccess: (requiredRoles: Role[]) => {
      return userRole ? requiredRoles.includes(userRole) : false
    }
  }
}
