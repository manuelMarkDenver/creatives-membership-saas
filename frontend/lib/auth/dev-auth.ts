// Development authentication helper
// This simulates authentication for testing purposes

export interface DevUser {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF'
  tenantId: string | null
  tenant?: {
    id: string
    name: string
  } | null
}

// Super Admin user data from backend
const SUPER_ADMIN_USER: DevUser = {
  id: '675b1a8b-9a47-4f1b-83c7-30b624a3b726',
  email: 'admin@creatives-saas.com',
  name: 'Super Admin',
  firstName: 'Super',
  lastName: 'Admin',
  role: 'SUPER_ADMIN',
  tenantId: null,
  tenant: null
}

export const devAuth = {
  // Simulate login with Super Admin
  loginAsSuperAdmin(): DevUser {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(SUPER_ADMIN_USER))
      localStorage.setItem('auth_token', 'dev-super-admin-token')
    }
    return SUPER_ADMIN_USER
  },
  
  // Get current user
  getCurrentUser(): DevUser | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          return JSON.parse(userData)
        } catch {
          return null
        }
      }
    }
    return null
  },
  
  // Check if user is logged in
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  },
  
  // Logout
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data')
      localStorage.removeItem('auth_token')
    }
  }
}
