import { 
  NotificationItem, 
  NotificationType, 
  CreateNotificationRequest,
  NotificationSummary,
  NotificationFilters,
  NotificationRule 
} from '../types/Notifications';
import { PendingOrderItem, PendingOrderStatus } from '../types/PendingOrders';
import { InventoryItem } from '../types/Inventory';
import { ProductionUnit } from '../types/Production';
import certificateService from './certificateService';

class SmartNotificationService {
  private storageKey = 'smart_notifications';
  private rulesKey = 'notification_rules';
  private listeners: Array<(notifications: NotificationItem[]) => void> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  // ============================================================================
  // CORE NOTIFICATION MANAGEMENT
  // ============================================================================

  async createNotification(request: CreateNotificationRequest): Promise<NotificationItem> {
    const currentUser = await certificateService.getCurrentUser();
    
    const notification: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: request.type,
      category: request.category,
      title: request.title,
      message: request.message,
      timestamp: new Date(),
      isRead: false,
      isImportant: request.isImportant || false,
      actionRequired: request.actionRequired || false,
      relatedEntityType: request.relatedEntityType as 'order' | 'inventory' | 'production' | 'user' | 'system' | undefined,
      relatedEntityId: request.relatedEntityId,
      actionUrl: request.actionUrl,
      actionLabel: request.actionLabel,
      metadata: request.metadata || {},
      expiresAt: request.expiresAt,
      userId: request.userId || currentUser.username || 'system',
      avatar: request.avatar,
      icon: request.icon,
    };

    this.saveNotification(notification);
    this.notifyListeners();
    
    console.log(`📧 Smart Notification Created: [${notification.category}] ${notification.title}`);
    
    return notification;
  }

  getNotifications(filters?: NotificationFilters): NotificationItem[] {
    const notifications = this.getAllNotifications();
    
    if (!filters) {
      return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    let filtered = notifications;

    if (filters.isRead !== undefined) {
      filtered = filtered.filter(n => n.isRead === filters.isRead);
    }

    if (filters.category) {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.actionRequired !== undefined) {
      filtered = filtered.filter(n => n.actionRequired === filters.actionRequired);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(n => n.timestamp >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(n => n.timestamp <= filters.dateTo!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (filters.offset || filters.limit) {
      const start = filters.offset || 0;
      const end = filters.limit ? start + filters.limit : undefined;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  getSummary(): NotificationSummary {
    const notifications = this.getAllNotifications();
    
    const summary: NotificationSummary = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      critical: notifications.filter(n => n.type === 'critical' || n.type === 'error').length,
      actionRequired: notifications.filter(n => n.actionRequired && !n.isRead).length,
      byCategory: {
        inventory: 0,
        orders: 0,
        production: 0,
        quality: 0,
        system: 0,
        user: 0,
        deadlines: 0,
        approvals: 0,
      },
      byType: {
        success: 0,
        warning: 0,
        error: 0,
        info: 0,
        critical: 0,
        reminder: 0,
      },
    };

    notifications.forEach(notification => {
      summary.byCategory[notification.category]++;
      summary.byType[notification.type]++;
    });

    return summary;
  }

  markAsRead(notificationId: string): void {
    const notifications = this.getAllNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      this.saveAllNotifications(notifications);
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    const notifications = this.getAllNotifications();
    notifications.forEach(n => n.isRead = true);
    this.saveAllNotifications(notifications);
    this.notifyListeners();
  }

  deleteNotification(notificationId: string): void {
    const notifications = this.getAllNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.saveAllNotifications(filtered);
    this.notifyListeners();
  }

  clearExpiredNotifications(): void {
    const notifications = this.getAllNotifications();
    const now = new Date();
    const filtered = notifications.filter(n => !n.expiresAt || n.expiresAt > now);
    
    if (filtered.length !== notifications.length) {
      this.saveAllNotifications(filtered);
      this.notifyListeners();
      console.log(`🧹 Cleared ${notifications.length - filtered.length} expired notifications`);
    }
  }

  // ============================================================================
  // SMART MANUFACTURING NOTIFICATIONS
  // ============================================================================

  // Inventory-related notifications
  async notifyLowStock(item: InventoryItem): Promise<void> {
    if (item.current_stock_level <= (item.reorder_point || 0)) {
      await this.createNotification({
        type: item.current_stock_level === 0 ? 'critical' : 'warning',
        category: 'inventory',
        title: item.current_stock_level === 0 ? 'Stock Out Alert' : 'Low Stock Alert',
        message: item.current_stock_level === 0 
          ? `${item.item_name} is completely out of stock!`
          : `${item.item_name} is running low (${item.current_stock_level} ${item.unit_of_measure} remaining)`,
        actionRequired: true,
        relatedEntityType: 'inventory',
        relatedEntityId: item.inventory_item_id,
        actionUrl: `/inventory/${item.inventory_item_id}`,
        actionLabel: 'View Item',
        metadata: { 
          currentStock: item.current_stock_level,
          reorderPoint: item.reorder_point,
          unitOfMeasure: item.unit_of_measure 
        },
        icon: '📦',
      });
    }
  }

  async notifyInventoryAdjustment(item: InventoryItem, adjustment: number, reason: string): Promise<void> {
    const adjustmentType = adjustment > 0 ? 'increase' : 'decrease';
    await this.createNotification({
      type: 'info',
      category: 'inventory',
      title: `Inventory ${adjustmentType.charAt(0).toUpperCase() + adjustmentType.slice(1)}`,
      message: `${item.item_name} stock ${adjustmentType}d by ${Math.abs(adjustment)} ${item.unit_of_measure}. Reason: ${reason}`,
      relatedEntityType: 'inventory',
      relatedEntityId: item.inventory_item_id,
      actionUrl: `/inventory/${item.inventory_item_id}`,
      actionLabel: 'View Details',
      metadata: { adjustment, reason, newStock: item.current_stock_level },
      icon: adjustment > 0 ? '📈' : '📉',
    });
  }

  // Order-related notifications
  async notifyOrderStatusChange(order: PendingOrderItem, oldStatus: PendingOrderStatus): Promise<void> {
    const statusMessages = {
      requested: { title: 'Order Requested', icon: '📝' },
      ordered: { title: 'Order Placed', icon: '🛒' },
      shipped: { title: 'Order Shipped', icon: '🚚' },
      partial: { title: 'Partial Receipt', icon: '📦' },
      received: { title: 'Order Received', icon: '✅' },
      cancelled: { title: 'Order Cancelled', icon: '❌' },
    };

    const statusInfo = statusMessages[order.status];
    
    await this.createNotification({
      type: order.status === 'cancelled' ? 'warning' : 
            order.status === 'received' ? 'success' : 'info',
      category: 'orders',
      title: statusInfo.title,
      message: `${order.item_name} (${order.quantity_requested} ${order.unit_of_measure}) status changed from ${oldStatus} to ${order.status}`,
      relatedEntityType: 'order',
      relatedEntityId: order.pending_order_id,
      actionUrl: `/orders/pending`,
      actionLabel: 'View Orders',
      metadata: { 
        oldStatus, 
        newStatus: order.status,
        itemName: order.item_name,
        quantity: order.quantity_requested 
      },
      icon: statusInfo.icon,
    });
  }

  async notifyOrderDeadline(order: PendingOrderItem, daysOverdue: number): Promise<void> {
    await this.createNotification({
      type: daysOverdue > 7 ? 'critical' : 'warning',
      category: 'deadlines',
      title: daysOverdue > 0 ? 'Order Overdue' : 'Order Due Soon',
      message: daysOverdue > 0 
        ? `${order.item_name} order is ${daysOverdue} days overdue`
        : `${order.item_name} order is due soon`,
      actionRequired: true,
      relatedEntityType: 'order',
      relatedEntityId: order.pending_order_id,
      actionUrl: `/orders/pending`,
      actionLabel: 'Review Order',
      metadata: { daysOverdue, orderDate: order.date_requested },
      icon: '⏰',
    });
  }

  // Production-related notifications
  async notifyProductionMilestone(unit: ProductionUnit, stepName: string): Promise<void> {
    await this.createNotification({
      type: 'success',
      category: 'production',
      title: 'Production Milestone',
      message: `Unit ${unit.unit_serial_number} completed step: ${stepName}`,
      relatedEntityType: 'production',
      relatedEntityId: unit.item_id,
      actionUrl: `/projects/${unit.project_id}`,
      actionLabel: 'View Project',
      metadata: { 
        unitSerial: unit.unit_serial_number,
        stepName,
        completedAt: new Date() 
      },
      icon: '🏭',
    });
  }

  async notifyProductionDelay(unit: ProductionUnit, expectedDate: Date, actualDate: Date): Promise<void> {
    const delayDays = Math.ceil((actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    await this.createNotification({
      type: 'warning',
      category: 'production',
      title: 'Production Delay',
      message: `Unit ${unit.unit_serial_number} is ${delayDays} days behind schedule`,
      actionRequired: true,
      relatedEntityType: 'production',
      relatedEntityId: unit.item_id,
      actionUrl: `/projects/${unit.project_id}`,
      actionLabel: 'Review Schedule',
      metadata: { 
        unitSerial: unit.unit_serial_number,
        delayDays,
        expectedDate,
        actualDate 
      },
      icon: '⚠️',
    });
  }

  // System notifications
  async notifySystemEvent(title: string, message: string, type: NotificationType = 'info'): Promise<void> {
    await this.createNotification({
      type,
      category: 'system',
      title,
      message,
      metadata: { timestamp: new Date() },
      icon: '⚙️',
    });
  }

  // User action notifications
  async notifyUserAction(action: string, details: string, actionRequired: boolean = false): Promise<void> {
    await this.createNotification({
      type: actionRequired ? 'warning' : 'info',
      category: 'user',
      title: `User Action: ${action}`,
      message: details,
      actionRequired,
      metadata: { action, timestamp: new Date() },
      icon: '👤',
    });
  }

  // ============================================================================
  // EVENT LISTENERS & INTEGRATION
  // ============================================================================

  subscribe(listener: (notifications: NotificationItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const notifications = this.getNotifications({ limit: 50 });
    this.listeners.forEach(listener => listener(notifications));
  }

  // ============================================================================
  // STORAGE MANAGEMENT
  // ============================================================================

  private saveNotification(notification: NotificationItem): void {
    const notifications = this.getAllNotifications();
    notifications.unshift(notification);
    
    // Keep only the last 1000 notifications
    if (notifications.length > 1000) {
      notifications.splice(1000);
    }
    
    this.saveAllNotifications(notifications);
  }

  private getAllNotifications(): NotificationItem[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
      }));
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  private saveAllNotifications(notifications: NotificationItem[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // ============================================================================
  // NOTIFICATION RULES
  // ============================================================================

  private initializeDefaultRules(): void {
    const existingRules = this.getNotificationRules();
    
    if (existingRules.length === 0) {
      const defaultRules: NotificationRule[] = [
        {
          id: 'low_stock_warning',
          name: 'Low Stock Warning',
          category: 'inventory',
          type: 'warning',
          conditions: [
            { field: 'current_stock_level', operator: 'less_than', value: 'reorder_point' }
          ],
          template: {
            title: 'Low Stock Alert',
            message: 'Item {{item_name}} is running low ({{current_stock_level}} {{unit_of_measure}} remaining)',
            actionUrl: '/inventory/{{inventory_item_id}}',
            actionLabel: 'Reorder Now'
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'order_overdue',
          name: 'Order Overdue',
          category: 'deadlines',
          type: 'critical',
          conditions: [
            { field: 'days_since_ordered', operator: 'greater_than', value: 14 }
          ],
          template: {
            title: 'Order Overdue',
            message: 'Order for {{item_name}} is {{days_overdue}} days overdue',
            actionUrl: '/orders/pending',
            actionLabel: 'Review Order'
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      this.saveNotificationRules(defaultRules);
    }
  }

  private getNotificationRules(): NotificationRule[] {
    try {
      const stored = localStorage.getItem(this.rulesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notification rules:', error);
      return [];
    }
  }

  private saveNotificationRules(rules: NotificationRule[]): void {
    try {
      localStorage.setItem(this.rulesKey, JSON.stringify(rules));
    } catch (error) {
      console.error('Error saving notification rules:', error);
    }
  }

  // ============================================================================
  // TASK ASSIGNMENT NOTIFICATIONS
  // ============================================================================

  async createTaskAssignmentNotification(
    taskTitle: string,
    assignedTo: string,
    assignedBy: string,
    priority: 'Low' | 'Medium' | 'High' | 'Critical',
    dueDate?: Date,
    projectId?: string
  ): Promise<NotificationItem> {
    const priorityEmojis = {
      'Low': '🟢',
      'Medium': '🟡', 
      'High': '🟠',
      'Critical': '🔴'
    };

    const dueDateText = dueDate ? ` (Due: ${dueDate.toLocaleDateString()})` : '';
    
    return this.createNotification({
      type: priority === 'Critical' ? 'critical' : priority === 'High' ? 'warning' : 'info',
      category: 'user',
      title: `New Task Assigned: ${taskTitle}`,
      message: `${assignedBy} has assigned you a ${priority.toLowerCase()} priority task${dueDateText}`,
      isImportant: priority === 'Critical' || priority === 'High',
      actionRequired: true,
      actionUrl: '/my-tasks',
      actionLabel: 'View My Tasks',
      userId: assignedTo,
      icon: priorityEmojis[priority],
      metadata: {
        taskTitle,
        assignedBy,
        priority,
        dueDate: dueDate?.toISOString(),
        projectId,
        notificationType: 'task_assignment'
      }
    });
  }

  async createTaskUpdateNotification(
    taskTitle: string,
    userId: string,
    status: string,
    updatedBy: string
  ): Promise<NotificationItem> {
    const statusEmojis = {
      'Completed': '✅',
      'In Progress': '⏳',
      'On Hold': '⏸️',
      'Cancelled': '❌'
    };

    return this.createNotification({
      type: status === 'Completed' ? 'success' : 'info',
      category: 'user',
      title: `Task Updated: ${taskTitle}`,
      message: `${updatedBy} updated the task status to "${status}"`,
      isImportant: false,
      actionRequired: false,
      actionUrl: '/my-tasks',
      actionLabel: 'View Tasks',
      userId: userId,
      icon: statusEmojis[status as keyof typeof statusEmojis] || '📝',
      metadata: {
        taskTitle,
        status,
        updatedBy,
        notificationType: 'task_update'
      }
    });
  }

  // ============================================================================
  // CLEANUP & MAINTENANCE
  // ============================================================================

  startPeriodicCleanup(): void {
    // Clean up expired notifications every hour
    setInterval(() => {
      this.clearExpiredNotifications();
    }, 60 * 60 * 1000);

    // Initial cleanup
    this.clearExpiredNotifications();
  }

  clearAllNotifications(): void {
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }
}

// Export singleton instance
export const smartNotifications = new SmartNotificationService();
export default smartNotifications;
