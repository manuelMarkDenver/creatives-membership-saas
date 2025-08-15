import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  businessUnitsApi, 
  BusinessUnit, 
  BusinessUnitStats, 
  CreateBusinessUnitData, 
  UpdateBusinessUnitData 
} from '../api/business-units'

interface BusinessUnitsStore {
  // Data State
  businessUnits: BusinessUnit[]
  businessUnitStats: BusinessUnitStats | null
  paidModeEnabled: boolean
  freeUnitsLimit: number
  
  // Loading States
  isLoadingUnits: boolean
  isLoadingStats: boolean
  isLoadingPaidModeStatus: boolean
  isCreatingUnit: boolean
  isUpdatingUnit: boolean
  isDeletingUnit: boolean
  isTogglingPaidMode: boolean
  isActivatingUnit: boolean
  isDeactivatingUnit: boolean
  
  // Error States
  unitsError: string | null
  statsError: string | null
  paidModeError: string | null
  createError: string | null
  updateError: string | null
  deleteError: string | null
  toggleError: string | null
  activationError: string | null
  
  // Actions
  loadBusinessUnits: () => Promise<void>
  loadBusinessUnitStats: () => Promise<void>
  loadPaidModeStatus: () => Promise<void>
  createBusinessUnit: (data: CreateBusinessUnitData) => Promise<BusinessUnit | null>
  updateBusinessUnit: (id: string, data: UpdateBusinessUnitData) => Promise<BusinessUnit | null>
  deleteBusinessUnit: (id: string) => Promise<boolean>
  togglePaidMode: (enabled: boolean) => Promise<boolean>
  activateBusinessUnit: (id: string) => Promise<BusinessUnit | null>
  deactivateBusinessUnit: (id: string) => Promise<BusinessUnit | null>
  
  // Getters
  getBusinessUnit: (id: string) => BusinessUnit | null
  getActiveUnits: () => BusinessUnit[]
  getPaidUnits: () => BusinessUnit[]
  getTrialUnits: () => BusinessUnit[]
  canCreateMoreUnits: () => boolean
  
  // Reset
  reset: () => void
}

const initialState = {
  businessUnits: [],
  businessUnitStats: null,
  paidModeEnabled: false,
  freeUnitsLimit: 1,
  isLoadingUnits: false,
  isLoadingStats: false,
  isLoadingPaidModeStatus: false,
  isCreatingUnit: false,
  isUpdatingUnit: false,
  isDeletingUnit: false,
  isTogglingPaidMode: false,
  isActivatingUnit: false,
  isDeactivatingUnit: false,
  unitsError: null,
  statsError: null,
  paidModeError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  toggleError: null,
  activationError: null,
}

export const useBusinessUnitsStore = create<BusinessUnitsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Load business units
      loadBusinessUnits: async () => {
        set({ isLoadingUnits: true, unitsError: null })
        try {
          const units = await businessUnitsApi.getBusinessUnits()
          set({ businessUnits: units, isLoadingUnits: false })
        } catch (error) {
          set({ 
            unitsError: error instanceof Error ? error.message : 'Failed to load business units',
            isLoadingUnits: false 
          })
        }
      },
      
      // Load business unit stats
      loadBusinessUnitStats: async () => {
        set({ isLoadingStats: true, statsError: null })
        try {
          const stats = await businessUnitsApi.getBusinessUnitStats()
          set({ businessUnitStats: stats, isLoadingStats: false })
        } catch (error) {
          set({ 
            statsError: error instanceof Error ? error.message : 'Failed to load business unit stats',
            isLoadingStats: false 
          })
        }
      },
      
      // Load paid mode status
      loadPaidModeStatus: async () => {
        set({ isLoadingPaidModeStatus: true, paidModeError: null })
        try {
          const status = await businessUnitsApi.getPaidModeStatus()
          set({ 
            paidModeEnabled: status.enabled,
            freeUnitsLimit: status.freeUnitsLimit,
            isLoadingPaidModeStatus: false 
          })
        } catch (error) {
          set({ 
            paidModeError: error instanceof Error ? error.message : 'Failed to load paid mode status',
            isLoadingPaidModeStatus: false 
          })
        }
      },
      
      // Create business unit
      createBusinessUnit: async (data: CreateBusinessUnitData) => {
        set({ isCreatingUnit: true, createError: null })
        try {
          const newUnit = await businessUnitsApi.createBusinessUnit(data)
          const { businessUnits } = get()
          set({ 
            businessUnits: [...businessUnits, newUnit],
            isCreatingUnit: false 
          })
          return newUnit
        } catch (error) {
          set({ 
            createError: error instanceof Error ? error.message : 'Failed to create business unit',
            isCreatingUnit: false 
          })
          return null
        }
      },
      
      // Update business unit
      updateBusinessUnit: async (id: string, data: UpdateBusinessUnitData) => {
        set({ isUpdatingUnit: true, updateError: null })
        try {
          const updatedUnit = await businessUnitsApi.updateBusinessUnit(id, data)
          const { businessUnits } = get()
          const updatedUnits = businessUnits.map(unit => 
            unit.id === id ? updatedUnit : unit
          )
          set({ 
            businessUnits: updatedUnits,
            isUpdatingUnit: false 
          })
          return updatedUnit
        } catch (error) {
          set({ 
            updateError: error instanceof Error ? error.message : 'Failed to update business unit',
            isUpdatingUnit: false 
          })
          return null
        }
      },
      
      // Delete business unit
      deleteBusinessUnit: async (id: string) => {
        set({ isDeletingUnit: true, deleteError: null })
        try {
          await businessUnitsApi.deleteBusinessUnit(id)
          const { businessUnits } = get()
          const filteredUnits = businessUnits.filter(unit => unit.id !== id)
          set({ 
            businessUnits: filteredUnits,
            isDeletingUnit: false 
          })
          return true
        } catch (error) {
          set({ 
            deleteError: error instanceof Error ? error.message : 'Failed to delete business unit',
            isDeletingUnit: false 
          })
          return false
        }
      },
      
      // Toggle paid mode
      togglePaidMode: async (enabled: boolean) => {
        set({ isTogglingPaidMode: true, toggleError: null })
        try {
          const result = await businessUnitsApi.togglePaidMode({ enabled })
          set({ 
            paidModeEnabled: result.enabled,
            isTogglingPaidMode: false 
          })
          return true
        } catch (error) {
          set({ 
            toggleError: error instanceof Error ? error.message : 'Failed to toggle paid mode',
            isTogglingPaidMode: false 
          })
          return false
        }
      },
      
      // Activate business unit
      activateBusinessUnit: async (id: string) => {
        set({ isActivatingUnit: true, activationError: null })
        try {
          const activatedUnit = await businessUnitsApi.activateBusinessUnit(id)
          const { businessUnits } = get()
          const updatedUnits = businessUnits.map(unit => 
            unit.id === id ? activatedUnit : unit
          )
          set({ 
            businessUnits: updatedUnits,
            isActivatingUnit: false 
          })
          return activatedUnit
        } catch (error) {
          set({ 
            activationError: error instanceof Error ? error.message : 'Failed to activate business unit',
            isActivatingUnit: false 
          })
          return null
        }
      },
      
      // Deactivate business unit
      deactivateBusinessUnit: async (id: string) => {
        set({ isDeactivatingUnit: true, activationError: null })
        try {
          const deactivatedUnit = await businessUnitsApi.deactivateBusinessUnit(id)
          const { businessUnits } = get()
          const updatedUnits = businessUnits.map(unit => 
            unit.id === id ? deactivatedUnit : unit
          )
          set({ 
            businessUnits: updatedUnits,
            isDeactivatingUnit: false 
          })
          return deactivatedUnit
        } catch (error) {
          set({ 
            activationError: error instanceof Error ? error.message : 'Failed to deactivate business unit',
            isDeactivatingUnit: false 
          })
          return null
        }
      },
      
      // Getters
      getBusinessUnit: (id: string) => {
        const { businessUnits } = get()
        return businessUnits.find(unit => unit.id === id) || null
      },
      
      getActiveUnits: () => {
        const { businessUnits } = get()
        return businessUnits.filter(unit => unit.isActive)
      },
      
      getPaidUnits: () => {
        const { businessUnits } = get()
        return businessUnits.filter(unit => unit.isPaid)
      },
      
      getTrialUnits: () => {
        const { businessUnits } = get()
        return businessUnits.filter(unit => !unit.isPaid && unit.isActive)
      },
      
      canCreateMoreUnits: () => {
        const { businessUnits, paidModeEnabled, freeUnitsLimit } = get()
        
        // If paid mode is enabled, unlimited units allowed
        if (paidModeEnabled) {
          return true
        }
        
        // If paid mode is disabled, check against free units limit
        const activeUnits = businessUnits.filter(unit => unit.isActive)
        return activeUnits.length < freeUnitsLimit
      },
      
      // Reset
      reset: () => set(initialState),
    }),
    { name: 'BusinessUnitsStore' }
  )
)
