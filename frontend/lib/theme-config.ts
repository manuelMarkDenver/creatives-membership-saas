/**
 * GymBossLab Theme Configuration
 * 
 * Brand colors matching the logo's pink-to-orange gradient
 * Includes light and dark mode variants
 */

export const themeConfig = {
  // Primary brand colors (pink/purple/orange gradient)
  colors: {
    primary: {
      light: 'from-pink-600 via-purple-600 to-orange-500',
      dark: 'from-pink-500 via-purple-500 to-orange-400',
      hover: {
        light: 'from-pink-700 via-purple-700 to-orange-600',
        dark: 'from-pink-600 via-purple-600 to-orange-500',
      },
      // Solid colors for specific uses
      solid: {
        pink: {
          light: 'bg-pink-600',
          dark: 'bg-pink-500',
          text: {
            light: 'text-pink-600',
            dark: 'text-pink-400',
          },
          border: {
            light: 'border-pink-600',
            dark: 'border-pink-500',
          },
        },
        purple: {
          light: 'bg-purple-600',
          dark: 'bg-purple-500',
          text: {
            light: 'text-purple-600',
            dark: 'text-purple-400',
          },
          border: {
            light: 'border-purple-600',
            dark: 'border-purple-500',
          },
        },
        orange: {
          light: 'bg-orange-500',
          dark: 'bg-orange-400',
          text: {
            light: 'text-orange-500',
            dark: 'text-orange-400',
          },
          border: {
            light: 'border-orange-500',
            dark: 'border-orange-400',
          },
        },
      },
    },
    // Secondary/accent colors
    secondary: {
      light: 'from-purple-600 to-indigo-600',
      dark: 'from-purple-500 to-indigo-500',
    },
    // Success (keep green for positive actions)
    success: {
      light: 'bg-emerald-600',
      dark: 'bg-emerald-500',
      text: {
        light: 'text-emerald-600',
        dark: 'text-emerald-400',
      },
    },
    // Danger (keep red for destructive actions)
    danger: {
      light: 'bg-red-600',
      dark: 'bg-red-500',
      text: {
        light: 'text-red-600',
        dark: 'text-red-400',
      },
    },
  },
  
  // Common component styles
  components: {
    button: {
      primary: 'bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 hover:from-pink-700 hover:via-purple-700 hover:to-orange-600 dark:from-pink-500 dark:via-purple-500 dark:to-orange-400 dark:hover:from-pink-600 dark:hover:via-purple-600 dark:hover:to-orange-500 text-white',
      outline: 'border-2 border-pink-600 dark:border-pink-500 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20',
    },
    badge: {
      primary: 'bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-500 dark:to-purple-500 text-white',
      outline: 'border border-pink-600 dark:border-pink-500 text-pink-600 dark:text-pink-400',
    },
    input: {
      focus: 'focus:border-pink-500 focus:ring-pink-500/20 dark:focus:border-pink-400 dark:focus:ring-pink-400/20',
    },
    link: {
      primary: 'text-pink-600 hover:text-purple-600 dark:text-pink-400 dark:hover:text-purple-400',
    },
  },
  
  // Brand name
  brand: {
    name: 'GymBossLab',
    tagline: 'Complete management solution for gyms and fitness centers',
    logo: '/gymbosslab-logo.jpeg',
  },
} as const

// Helper function to get gradient classes
export const getPrimaryGradient = (isDark: boolean = false) => {
  return `bg-gradient-to-r ${isDark ? themeConfig.colors.primary.dark : themeConfig.colors.primary.light}`
}

// Helper function to get hover gradient classes
export const getPrimaryHoverGradient = (isDark: boolean = false) => {
  return `${isDark ? themeConfig.colors.primary.hover.dark : themeConfig.colors.primary.hover.light}`
}

// Helper for text gradient
export const getPrimaryTextGradient = () => {
  return 'bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 dark:from-pink-400 dark:via-purple-400 dark:to-orange-400 bg-clip-text text-transparent'
}
