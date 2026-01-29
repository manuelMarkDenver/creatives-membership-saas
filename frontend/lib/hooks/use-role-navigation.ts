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
  Shield,
  CalendarDays,
  Upload,
  Monitor
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
  {
    name: 'Member Import',
    href: '/admin/imports/members',
    icon: Upload,
    roles: ['SUPER_ADMIN' as Role],
    description: 'Bulk import members via CSV'
  },
  {
    name: 'Card Inventory',
    href: '/admin/inventory-cards',
    icon: CreditCard,
    roles: ['SUPER_ADMIN' as Role],
    description: 'Manage allocated card inventory'
  },
  {
    name: 'Terminals',
    href: '/admin/terminals',
    icon: Monitor,
    roles: ['SUPER_ADMIN' as Role],
    description: 'Register and manage kiosks'
  },

  // Dashboard - Available to all authenticated users
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role, 'CLIENT' as Role],
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
    description: 'Manage tenant membership plans',
    isFutureFeature: true
  },
  {
    name: 'Daily',
    href: '/daily',
    icon: CalendarDays,
    roles: ['OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role],
    description: 'Daily walk-in entries and reports'
  },

  // Member-specific
  {
    name: 'My Membership',
    href: '/my-membership',
    icon: Calendar,
    roles: ['CLIENT' as Role],
    description: 'Your membership details'
  },

  // Active Features - Branches Management  
  {
    name: 'Branches',
    href: '/locations',
    icon: MapPin,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role],
    description: 'Manage gym branches'
  },
  {
    name: 'Card Inventory',
    href: '/inventory',
    icon: CreditCard,
    roles: ['OWNER' as Role, 'MANAGER' as Role],
    description: 'Card inventory status and usage'
  },

  // Future Features - Disabled/Coming Soon
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
  },
  {
    name: 'Tenant Settings',
    href: '/tenant-settings',
    icon: Settings,
    roles: ['OWNER' as Role],
    description: 'Configure your gym settings',
    isFutureFeature: true
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN' as Role, 'OWNER' as Role, 'MANAGER' as Role, 'STAFF' as Role, 'CLIENT' as Role],
    description: 'Account and preferences',
    isFutureFeature: true
  },
]

export function useRoleNavigation(userRole?: Role) {
  const navigation = useMemo(() => {
    if (!userRole) return []

    return NAVIGATION_ITEMS.filter(item =>
      item.roles.includes(userRole) && !item.isFutureFeature
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
      case 'CLIENT':
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
