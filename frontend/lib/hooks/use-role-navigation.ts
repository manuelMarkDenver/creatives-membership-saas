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
    roles: ['SUPER_ADMIN' as Role],
    description: 'Manage all gym tenants'
  },

  // Dashboard - Available to all authenticated users
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role, 'GYM_MEMBER' as Role],
    description: 'Overview and analytics'
  },

  // Member Management - Active Features
  {
    name: 'Members',
    href: '/members',
    icon: Users,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role],
    description: 'Manage gym members'
  },
  {
    name: 'Membership Plans',
    href: '/membership-plans',
    icon: Calendar,
    roles: ['OWNER' as Role, 'MANAGER' as Role],
    description: 'Manage tenant membership plans'
  },

  // Member-specific
  {
    name: 'My Membership',
    href: '/my-membership',
    icon: Calendar,
    roles: ['GYM_MEMBER' as Role],
    description: 'Your membership details'
  },

  // Future Features - Disabled/Coming Soon
  {
    name: 'Locations',
    href: '/locations',
    icon: MapPin,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role],
    description: 'Manage gym locations',
    isFutureFeature: true
  },
  {
    name: 'Staff',
    href: '/staff',
    icon: UserPlus,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role],
    description: 'Manage staff members',
    isFutureFeature: true
  },
  {
    name: 'Member Subscriptions',
    href: '/member-subscriptions',
    icon: Calendar,
    roles: ['OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role],
    description: 'Manage gym membership plans',
    isFutureFeature: true
  },
  {
    name: 'Subscription',
    href: '/subscription',
    icon: CreditCard,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role],
    description: 'Billing and subscription status',
    isFutureFeature: true
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Shield,
    roles: ['SUPER_ADMIN' as Role],
    description: 'System-wide configuration',
    isFutureFeature: true
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role, 'GYM_MEMBER' as Role],
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
        return '/members'
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
