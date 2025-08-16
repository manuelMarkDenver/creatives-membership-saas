import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationsApi, CreateLocationDto, UpdateLocationDto, LocationQueryParams } from '@/lib/api/locations'
import { Location } from '@/types'

// Query keys
export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (params?: LocationQueryParams) => [...locationKeys.lists(), params] as const,
  byTenant: (tenantId: string, params?: Omit<LocationQueryParams, 'tenantId'>) => 
    [...locationKeys.all, 'tenant', tenantId, params] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
  stats: (id: string) => [...locationKeys.all, 'stats', id] as const,
}

// Get all locations
export function useLocations(params?: LocationQueryParams) {
  return useQuery({
    queryKey: locationKeys.list(params),
    queryFn: () => locationsApi.getAll(params),
    enabled: true,
  })
}

// Get locations by tenant
export function useLocationsByTenant(
  tenantId: string, 
  params?: Omit<LocationQueryParams, 'tenantId'>
) {
  return useQuery({
    queryKey: locationKeys.byTenant(tenantId, params),
    queryFn: () => locationsApi.getByTenant(tenantId, params),
    enabled: !!tenantId,
  })
}

// Get location by ID
export function useLocation(id: string) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: () => locationsApi.getById(id),
    enabled: !!id,
  })
}

// Get location stats
export function useLocationStats(id: string) {
  return useQuery({
    queryKey: locationKeys.stats(id),
    queryFn: () => locationsApi.getStats(id),
    enabled: !!id,
  })
}

// Create location mutation
export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLocationDto) => locationsApi.create(data),
    onSuccess: (newLocation: Location) => {
      // Invalidate location lists
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...locationKeys.all, 'tenant', newLocation.tenantId] 
      })
      
      // Add new location to cache
      queryClient.setQueryData(locationKeys.detail(newLocation.id), newLocation)
    },
  })
}

// Update location mutation
export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationDto }) =>
      locationsApi.update(id, data),
    onSuccess: (updatedLocation: Location) => {
      // Update cached location
      queryClient.setQueryData(locationKeys.detail(updatedLocation.id), updatedLocation)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: [...locationKeys.all, 'tenant', updatedLocation.tenantId] 
      })
    },
  })
}

// Delete location mutation
export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => locationsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: locationKeys.detail(deletedId) })
      queryClient.removeQueries({ queryKey: locationKeys.stats(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...locationKeys.all, 'tenant'] })
    },
  })
}

// Assign staff to location mutation
export function useAssignStaffToLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ locationId, data }: { locationId: string; data: { userId: string; accessLevel: string } }) =>
      locationsApi.assignStaff(locationId, data),
    onSuccess: (_, { locationId }) => {
      // Invalidate location details and stats to refresh staff assignments
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) })
      queryClient.invalidateQueries({ queryKey: locationKeys.stats(locationId) })
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
    },
  })
}

// Update staff location access mutation
export function useUpdateStaffLocationAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ locationId, userId, data }: { 
      locationId: string; 
      userId: string; 
      data: { accessLevel: string } 
    }) =>
      locationsApi.updateStaffAccess(locationId, userId, data),
    onSuccess: (_, { locationId }) => {
      // Invalidate location details and stats to refresh staff assignments
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) })
      queryClient.invalidateQueries({ queryKey: locationKeys.stats(locationId) })
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
    },
  })
}
