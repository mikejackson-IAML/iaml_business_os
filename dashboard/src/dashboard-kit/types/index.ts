// Core dashboard types
export * from './dashboard';

// Department-specific types
export * from './departments/digital';
export * from './departments/lead-intelligence';
export * from './departments/marketing';
export * from './departments/programs';

// Re-export department configs for convenience
export { digitalDepartmentConfig } from './departments/digital';
export { leadIntelligenceDepartmentConfig } from './departments/lead-intelligence';
export { marketingDepartmentConfig } from './departments/marketing';
export { programsDepartmentConfig } from './departments/programs';
