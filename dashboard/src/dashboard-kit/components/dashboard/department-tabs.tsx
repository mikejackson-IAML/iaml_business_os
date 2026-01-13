'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { StatusIndicator } from './status-indicator';
import type { DepartmentConfig, HealthStatus } from '../../types';

interface DepartmentTabsProps {
  departments: DepartmentConfig[];
  currentDepartment: string;
  onDepartmentChange: (department: string) => void;
  departmentHealth?: Record<string, HealthStatus>;
  children?: React.ReactNode;
  className?: string;
}

export function DepartmentTabs({
  departments,
  currentDepartment,
  onDepartmentChange,
  departmentHealth = {},
  children,
  className,
}: DepartmentTabsProps) {
  return (
    <Tabs
      value={currentDepartment}
      onValueChange={onDepartmentChange}
      className={className}
    >
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
        {departments.map((dept) => {
          const health = departmentHealth[dept.department];

          return (
            <TabsTrigger
              key={dept.department}
              value={dept.department}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {dept.title || dept.department}
              {health && (
                <StatusIndicator status={health} size="sm" pulse={health === 'critical'} />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}

// Individual tab content wrapper
interface DepartmentTabContentProps {
  department: string;
  children: React.ReactNode;
  className?: string;
}

export function DepartmentTabContent({
  department,
  children,
  className,
}: DepartmentTabContentProps) {
  return (
    <TabsContent value={department} className={cn('mt-6', className)}>
      {children}
    </TabsContent>
  );
}

// Simplified pill-style department selector
interface DepartmentSelectorProps {
  departments: DepartmentConfig[];
  currentDepartment: string;
  onDepartmentChange: (department: string) => void;
  departmentHealth?: Record<string, HealthStatus>;
  className?: string;
}

export function DepartmentSelector({
  departments,
  currentDepartment,
  onDepartmentChange,
  departmentHealth = {},
  className,
}: DepartmentSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {departments.map((dept) => {
        const isActive = currentDepartment === dept.department;
        const health = departmentHealth[dept.department];

        return (
          <button
            key={dept.department}
            onClick={() => onDepartmentChange(dept.department)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {dept.title || dept.department}
            {health && (
              <StatusIndicator
                status={health}
                size="sm"
                pulse={health === 'critical'}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default DepartmentTabs;
