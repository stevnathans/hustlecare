// types/admin.ts
/**
 * TypeScript type definitions for Hustlecare Admin Dashboard
 */

import { User, Business, Product, Requirement, Vendor, Comment, Review, AuditLog } from '@prisma/client';

// ============================================================================
// Role & Permission Types
// ============================================================================

export type UserRole = 'user' | 'author' | 'editor' | 'reviewer' | 'admin';

export type Permission =
  | 'businesses.view'
  | 'businesses.create'
  | 'businesses.update'
  | 'businesses.delete'
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'requirements.view'
  | 'requirements.create'
  | 'requirements.update'
  | 'requirements.delete'
  | 'vendors.view'
  | 'vendors.create'
  | 'vendors.update'
  | 'vendors.delete'
  | 'users.view'
  | 'users.update'
  | 'users.delete'
  | 'comments.moderate'
  | 'reviews.moderate'
  | 'audit.view'
  | 'settings.manage';

// ============================================================================
// Extended Model Types (with relations and counts)
// ============================================================================

export type BusinessWithRelations = Business & {
  _count?: {
    requirements?: number;
    carts?: number;
    searches?: number;
  };
  user?: {
    name: string;
    email: string;
  } | null;
  requirements?: Requirement[];
};

export type ProductWithRelations = Product & {
  vendor?: Vendor | null;
  _count?: {
    reviews?: number;
    cartItems?: number;
  };
  reviews?: Review[];
};

export type RequirementWithRelations = Requirement & {
  business: {
    id: number;
    name: string;
    slug: string;
  };
  _count?: {
    comments?: number;
  };
  comments?: Comment[];
};

export type CommentWithRelations = Comment & {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  requirement: {
    id: number;
    name: string;
    business: {
      id: number;
      name: string;
      slug: string;
    };
  };
};

export type ReviewWithRelations = Review & {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  product: {
    id: number;
    name: string;
    image?: string | null;
  };
};

export type UserWithRelations = User & {
  _count?: {
    businesses?: number;
    carts?: number;
    comments?: number;
    reviews?: number;
    searches?: number;
  };
};

export type AuditLogWithRelations = AuditLog & {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Dashboard Statistics Types
// ============================================================================

export interface DashboardStats {
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
    trend: number;
  };
  businesses: {
    total: number;
    published: number;
    draft: number;
  };
  products: {
    total: number;
    averagePrice: number;
    byVendor: number;
  };
  requirements: {
    total: number;
    required: number;
    optional: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    pending: number;
  };
  searches: {
    total: number;
    uniqueKeywords: number;
    topKeyword: string;
  };
  carts: {
    total: number;
    totalValue: number;
    averageValue: number;
  };
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  user: string;
  timestamp: string;
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface BusinessFormData {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  published: boolean;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  url?: string;
  vendorId?: number | null;
}

export interface RequirementFormData {
  name: string;
  description?: string;
  image?: string;
  category: string;
  necessity: 'Required' | 'Optional';
  businessId: number;
}

export interface VendorFormData {
  name: string;
  website?: string;
  logo?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface FilterOptions {
  search?: string;
  role?: UserRole;
  published?: boolean;
  category?: string;
  necessity?: 'Required' | 'Optional';
  isApproved?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Bulk Operation Types
// ============================================================================

export interface BulkOperationRequest {
  ids: number[] | string[];
  action: 'delete' | 'publish' | 'unpublish' | 'approve' | 'reject';
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    id: number | string;
    error: string;
  }>;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  fields?: string[];
  filters?: FilterOptions;
}

export interface ExportResult {
  filename: string;
  url: string;
  recordCount: number;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'APPROVE' | 'REJECT';
export type AuditEntity = 'Business' | 'Product' | 'Requirement' | 'Vendor' | 'User' | 'Comment' | 'Review';

export interface AuditLogFilter {
  userId?: string;
  entity?: AuditEntity;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

// ============================================================================
// Session & Auth Types (extend NextAuth)
// ============================================================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    isActive: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
  }
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: T, item: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  error?: string;
  helperText?: string;
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles: UserRole[];
  badge?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// Error Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  validationErrors?: ValidationError[];
}

// ============================================================================
// Action Creator Types
// ============================================================================

export type AsyncActionStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncActionStatus;
  error: string | null;
}