// Dashboard color palette - customize these for your brand
export const colors = {
  primary: {
    lighter: '#60a5fa', // blue-400
    light: '#3b82f6',   // blue-500
    main: '#2563eb',    // blue-600
    dark: '#1d4ed8',    // blue-700
    darker: '#1e40af',  // blue-800
  },
  secondary: {
    lighter: '#a78bfa', // violet-400
    light: '#8b5cf6',   // violet-500
    main: '#7c3aed',    // violet-600
    dark: '#6d28d9',    // violet-700
    darker: '#5b21b6',  // violet-800
  },
  // Status colors for health indicators
  status: {
    healthy: {
      bg: '#10b981',      // emerald-500
      bgLight: '#d1fae5', // emerald-100
      text: '#065f46',    // emerald-800
    },
    warning: {
      bg: '#f59e0b',      // amber-500
      bgLight: '#fef3c7', // amber-100
      text: '#92400e',    // amber-800
    },
    critical: {
      bg: '#ef4444',      // red-500
      bgLight: '#fee2e2', // red-100
      text: '#991b1b',    // red-800
    },
  },
  // Department accent colors
  departments: {
    digital: '#3b82f6',      // blue
    'lead-intelligence': '#8b5cf6', // violet
    marketing: '#ec4899',    // pink
    programs: '#10b981',     // emerald
    finance: '#f59e0b',      // amber
    operations: '#06b6d4',   // cyan
  },
};

export type DepartmentKey = keyof typeof colors.departments;

export default colors;
