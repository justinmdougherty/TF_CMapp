export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
  actionRequired: boolean;
  relatedEntityType?: 'order' | 'inventory' | 'production' | 'user' | 'system';
  relatedEntityId?: string | number;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  userId?: string;
  avatar?: string;
  icon?: string;
}

export type NotificationType = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'critical'
  | 'reminder';

export type NotificationCategory = 
  | 'inventory'           // Stock alerts, reorder points, etc.
  | 'orders'             // Pending orders, receipts, shipping
  | 'production'         // Manufacturing progress, completion
  | 'quality'            // Quality control, defects
  | 'system'             // System status, updates
  | 'user'               // User actions, assignments
  | 'deadlines'          // Time-sensitive tasks
  | 'approvals';         // Approval requests

export interface NotificationPreferences {
  userId: string;
  categories: {
    [K in NotificationCategory]: {
      enabled: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
      urgentOnly: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  dailyDigest: {
    enabled: boolean;
    time: string; // HH:mm format
  };
}

export interface NotificationRule {
  id: string;
  name: string;
  category: NotificationCategory;
  type: NotificationType;
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'changed';
    value: any;
  }[];
  template: {
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  critical: number;
  actionRequired: number;
  byCategory: {
    [K in NotificationCategory]: number;
  };
  byType: {
    [K in NotificationType]: number;
  };
}

export interface CreateNotificationRequest {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  isImportant?: boolean;
  actionRequired?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  userId?: string;
  avatar?: string;
  icon?: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  category?: NotificationCategory;
  type?: NotificationType;
  actionRequired?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}
