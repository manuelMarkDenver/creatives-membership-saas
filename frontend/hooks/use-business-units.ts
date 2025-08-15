import { useEffect } from 'react'
import { useBusinessUnitsStore } from '../lib/stores/business-units-store'
import { BusinessUnit, CreateBusinessUnitData, UpdateBusinessUnitData } from '../lib/api/business-units'

interface UseBusinessUnitsOptions {
  autoLoad?: boolean
  loadStats?: boolean
  loadPaidModeStatus?: boolean
}

export const useBusinessUnits = (options: UseBusinessUnitsOptions = {}) => {
  const {
    autoLoad = true,
    loadStats = false,
    loadPaidModeStatus = true,
  } = options

  const {
    // Data
    businessUnits,
    businessUnitStats,
    paidModeEnabled,
    freeUnitsLimit,
    
    // Loading states
    isLoadingUnits,
    isLoadingStats,
    isLoadingPaidModeStatus,
    isCreatingUnit,
    isUpdatingUnit,
    isDeletingUnit,
    isTogglingPaidMode,
    isActivatingUnit,
    isDeactivatingUnit,
    
    // Error states
    unitsError,
    statsError,
    paidModeError,
    createError,
    updateError,
    deleteError,
    toggleError,
    activationError,
    
    // Actions
    loadBusinessUnits,
    loadBusinessUnitStats,
    loadPaidModeStatus: loadPaidModeStatusAction,
    createBusinessUnit,
    updateBusinessUnit,
    deleteBusinessUnit,
    togglePaidMode,
    activateBusinessUnit,
    deactivateBusinessUnit,
    
    // Getters
    getBusinessUnit,
    getActiveUnits,
    getPaidUnits,
    getTrialUnits,
    canCreateMoreUnits,
  } = useBusinessUnitsStore()

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad && businessUnits.length === 0 && !isLoadingUnits) {
      loadBusinessUnits()
    }
  }, [autoLoad, businessUnits.length, isLoadingUnits, loadBusinessUnits])

  // Load stats if requested
  useEffect(() => {
    if (loadStats && !businessUnitStats && !isLoadingStats) {
      loadBusinessUnitStats()
    }
  }, [loadStats, businessUnitStats, isLoadingStats, loadBusinessUnitStats])

  // Load paid mode status if requested
  useEffect(() => {
    if (loadPaidModeStatus && !isLoadingPaidModeStatus) {
      loadPaidModeStatusAction()
    }
  }, [loadPaidModeStatus, isLoadingPaidModeStatus, loadPaidModeStatusAction])

  // Helper functions
  const refresh = async () => {
    await loadBusinessUnits()
    if (loadStats) {
      await loadBusinessUnitStats()
    }
    if (loadPaidModeStatus) {
      await loadPaidModeStatusAction()
    }
  }

  const createUnit = async (data: CreateBusinessUnitData): Promise<BusinessUnit | null> => {
    const result = await createBusinessUnit(data)
    if (result && loadStats) {
      // Refresh stats after creating a unit
      loadBusinessUnitStats()
    }
    return result
  }

  const updateUnit = async (id: string, data: UpdateBusinessUnitData): Promise<BusinessUnit | null> => {
    const result = await updateBusinessUnit(id, data)
    if (result && loadStats) {
      // Refresh stats after updating a unit
      loadBusinessUnitStats()
    }
    return result
  }

  const deleteUnit = async (id: string): Promise<boolean> => {
    const result = await deleteBusinessUnit(id)
    if (result && loadStats) {
      // Refresh stats after deleting a unit
      loadBusinessUnitStats()
    }
    return result
  }

  const activateUnit = async (id: string): Promise<BusinessUnit | null> => {
    const result = await activateBusinessUnit(id)
    if (result && loadStats) {
      // Refresh stats after activation
      loadBusinessUnitStats()
    }
    return result
  }

  const deactivateUnit = async (id: string): Promise<BusinessUnit | null> => {
    const result = await deactivateBusinessUnit(id)
    if (result && loadStats) {
      // Refresh stats after deactivation
      loadBusinessUnitStats()
    }
    return result
  }

  const togglePaid = async (enabled: boolean): Promise<boolean> => {
    const result = await togglePaidMode(enabled)
    if (result) {
      // Reload paid mode status to get updated state
      await loadPaidModeStatusAction()
      if (loadStats) {
        await loadBusinessUnitStats()
      }
    }
    return result
  }

  // Computed values
  const activeUnitsCount = getActiveUnits().length
  const paidUnitsCount = getPaidUnits().length
  const trialUnitsCount = getTrialUnits().length
  const isAtFreeLimit = !paidModeEnabled && activeUnitsCount >= freeUnitsLimit

  return {
    // Data
    businessUnits,
    businessUnitStats,
    paidModeEnabled,
    freeUnitsLimit,
    activeUnitsCount,
    paidUnitsCount,
    trialUnitsCount,
    isAtFreeLimit,
    
    // Loading states
    isLoadingUnits,
    isLoadingStats,
    isLoadingPaidModeStatus,
    isCreatingUnit,
    isUpdatingUnit,
    isDeletingUnit,
    isTogglingPaidMode,
    isActivatingUnit,
    isDeactivatingUnit,
    isLoading: isLoadingUnits || isLoadingStats || isLoadingPaidModeStatus,
    isProcessing: isCreatingUnit || isUpdatingUnit || isDeletingUnit || isTogglingPaidMode || isActivatingUnit || isDeactivatingUnit,
    
    // Error states
    unitsError,
    statsError,
    paidModeError,
    createError,
    updateError,
    deleteError,
    toggleError,
    activationError,
    hasError: !!(unitsError || statsError || paidModeError || createError || updateError || deleteError || toggleError || activationError),
    
    // Actions
    refresh,
    createUnit,
    updateUnit,
    deleteUnit,
    activateUnit,
    deactivateUnit,
    togglePaid,
    
    // Getters
    getBusinessUnit,
    getActiveUnits,
    getPaidUnits,
    getTrialUnits,
    canCreateMoreUnits,
  }
}
