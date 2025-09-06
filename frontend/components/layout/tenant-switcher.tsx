'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTenants } from '@/lib/hooks/use-tenants'
import { useTenantContext } from '@/lib/providers/tenant-context'
import { useProfile } from '@/lib/hooks/use-gym-users'
import { cn } from '@/lib/utils'
import { Tenant } from '@/types'

export default function TenantSwitcher() {
  const [open, setOpen] = useState(false)
  const { currentTenant, setCurrentTenant } = useTenantContext()
  const { data: profile } = useProfile()
  
  // Only fetch tenants for Super Admins
  const { data: tenantsData } = useTenants(undefined, {
    enabled: profile?.role === 'SUPER_ADMIN'
  })

  const tenants = tenantsData || []

  // Don't render tenant switcher for non-super-admins
  if (profile?.role !== 'SUPER_ADMIN') {
    return null
  }

  const handleSelectTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a tenant"
          className="w-full justify-between"
        >
          {currentTenant ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">
                  {currentTenant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{currentTenant.name}</span>
            </div>
          ) : (
            'Select tenant...'
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0">
        <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
          Tenants
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant: Tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onSelect={() => handleSelectTenant(tenant)}
            className="flex items-center gap-2 px-2 py-1.5"
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {tenant.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm">{tenant.name}</span>
              <span className="text-xs text-muted-foreground">
                {tenant.category}
              </span>
            </div>
            <Check
              className={cn(
                'ml-auto h-4 w-4',
                currentTenant?.id === tenant.id ? 'opacity-100' : 'opacity-0'
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5">
          <Plus className="h-4 w-4" />
          <span>Create tenant</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
