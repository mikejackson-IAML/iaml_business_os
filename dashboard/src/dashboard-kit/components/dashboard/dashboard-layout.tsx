'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  X,
  Bell,
  RefreshCw,
  Search,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import type { NavItem, DepartmentConfig } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  departments: DepartmentConfig[];
  currentDepartment?: string;
  navItems?: NavItem[];
  title?: string;
  logo?: React.ReactNode;
  userInfo?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  onDepartmentChange?: (department: string) => void;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  notifications?: number;
  onNotificationClick?: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  className?: string;
}

// Map department IDs to icons
const departmentIcons: Record<string, LucideIcon> = {
  digital: LayoutDashboard,
  'lead-intelligence': LayoutDashboard,
  marketing: LayoutDashboard,
  programs: LayoutDashboard,
};

export function DashboardLayout({
  children,
  departments,
  currentDepartment,
  navItems = [],
  title = 'Dashboard',
  logo,
  userInfo,
  onDepartmentChange,
  onRefresh,
  onSearch,
  isRefreshing = false,
  lastUpdated,
  notifications = 0,
  onNotificationClick,
  theme = 'light',
  onThemeToggle,
  className,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            {logo || (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">B</span>
                </div>
                <span className="font-semibold">Business OS</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Department navigation */}
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Departments
            </p>
            <nav className="space-y-1">
              {departments.map((dept) => {
                const Icon = departmentIcons[dept.department] || LayoutDashboard;
                const isActive = currentDepartment === dept.department;

                return (
                  <button
                    key={dept.department}
                    onClick={() => {
                      onDepartmentChange?.(dept.department);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {dept.title || dept.department}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Additional nav items */}
          {navItems.length > 0 && (
            <div className="p-4 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Navigation
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      item.active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || 'secondary'}
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* User info at bottom */}
          {userInfo && (
            <div className="mt-auto p-4 border-t">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {userInfo.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userInfo.name}</p>
                  {userInfo.role && (
                    <p className="text-xs text-muted-foreground truncate">
                      {userInfo.role}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              {onSearch && (
                <form onSubmit={handleSearch} className="hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </form>
              )}

              {/* Last updated */}
              {lastUpdated && (
                <span className="hidden lg:block text-xs text-muted-foreground">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}

              {/* Refresh */}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                  />
                </Button>
              )}

              {/* Notifications */}
              {onNotificationClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNotificationClick}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </Button>
              )}

              {/* Theme toggle */}
              {onThemeToggle && (
                <Button variant="ghost" size="icon" onClick={onThemeToggle}>
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
