import React from 'react'
import toast, { Toaster, Renderable } from 'react-hot-toast'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface NotificationOptions {
  duration?: number
  position?: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left'
  style?: React.CSSProperties
  className?: string
  icon?: Renderable
  id?: string
}

class NotificationService {
  // Default options
  private defaultOptions: NotificationOptions = {
    duration: 4000,
    position: 'top-right'
  }

  // Success notifications
  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      duration: options?.duration || this.defaultOptions.duration,
      position: options?.position || this.defaultOptions.position,
      className: options?.className,
      icon: options?.icon,
      id: options?.id,
      style: {
        background: '#4caf50',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
        ...options?.style
      }
    })
  }

  // Error notifications
  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      duration: options?.duration || 6000, // Longer duration for errors
      position: options?.position || this.defaultOptions.position,
      className: options?.className,
      icon: options?.icon,
      id: options?.id,
      style: {
        background: '#f44336',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
        ...options?.style
      }
    })
  }

  // Warning notifications
  warning(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: options?.duration || this.defaultOptions.duration,
      position: options?.position || this.defaultOptions.position,
      className: options?.className,
      icon: options?.icon || '⚠️',
      id: options?.id,
      style: {
        background: '#ff9800',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
        ...options?.style
      }
    })
  }

  // Info notifications
  info(message: string, options?: NotificationOptions) {
    return toast(message, {
      duration: options?.duration || this.defaultOptions.duration,
      position: options?.position || this.defaultOptions.position,
      className: options?.className,
      icon: options?.icon || 'ℹ️',
      id: options?.id,
      style: {
        background: '#2196f3',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
        ...options?.style
      }
    })
  }

  // Loading notifications
  loading(message: string, options?: NotificationOptions) {
    return toast.loading(message, {
      duration: options?.duration || this.defaultOptions.duration,
      position: options?.position || this.defaultOptions.position,
      className: options?.className,
      icon: options?.icon,
      id: options?.id,
      style: {
        background: '#666',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
        ...options?.style
      }
    })
  }

  // Dismiss specific notification
  dismiss(toastId?: string) {
    toast.dismiss(toastId)
  }

  // Dismiss all notifications
  dismissAll() {
    toast.dismiss()
  }

  // Custom notification with full control
  custom(message: string, type: NotificationType, options?: NotificationOptions) {
    switch (type) {
      case 'success':
        return this.success(message, options)
      case 'error':
        return this.error(message, options)
      case 'warning':
        return this.warning(message, options)
      case 'info':
        return this.info(message, options)
      case 'loading':
        return this.loading(message, options)
      default:
        return toast(message, {
          duration: options?.duration || this.defaultOptions.duration,
          position: options?.position || this.defaultOptions.position,
          className: options?.className,
          icon: options?.icon,
          id: options?.id,
          style: options?.style
        })
    }
  }

  // Promise-based notifications (useful for async operations)
  async promise<T>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: NotificationOptions
  ): Promise<T> {
    return toast.promise(
      promise,
      {
        loading: loadingMessage,
        success: successMessage,
        error: errorMessage,
      },
      {
        position: options?.position || this.defaultOptions.position,
        className: options?.className,
        id: options?.id,
        style: {
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: 500,
          maxWidth: '400px',
          ...options?.style
        }
      }
    )
  }
}

// Export singleton instance
export const notifications = new NotificationService()

// Export Toaster component for app integration
export { Toaster }

// Project-specific notification helpers
export const projectNotifications = {
  // Project status changes
  statusUpdated: (projectName: string, status: string) => {
    notifications.success(`Project "${projectName}" status updated to ${status}`)
  },

  projectCreated: (projectName: string) => {
    notifications.success(`Project "${projectName}" created successfully`)
  },

  projectDeleted: (projectName: string) => {
    notifications.info(`Project "${projectName}" has been deleted`)
  },

  // Step completion notifications
  stepCompleted: (projectName: string, stepName: string, unitCount: number) => {
    notifications.success(
      `${stepName} completed for ${unitCount} unit${unitCount > 1 ? 's' : ''} in "${projectName}"`
    )
  },

  stepStarted: (projectName: string, stepName: string) => {
    notifications.info(`Started ${stepName} for project "${projectName}"`)
  },

  // Inventory notifications
  inventoryLowStock: (itemName: string, currentStock: number, minStock: number) => {
    notifications.warning(
      `Low stock alert: ${itemName} (${currentStock} remaining, minimum: ${minStock})`
    )
  },

  inventoryAdjusted: (itemName: string, action: 'added' | 'removed', quantity: number) => {
    notifications.success(
      `${action === 'added' ? 'Added' : 'Removed'} ${quantity} units of ${itemName}`
    )
  },

  partReplaced: (oldPart: string, newPart: string) => {
    notifications.info(`Part "${oldPart}" replaced with "${newPart}"`)
  },

  // Error notifications
  apiError: (operation: string, error?: string) => {
    notifications.error(
      `Failed to ${operation}${error ? `: ${error}` : ''}. Please try again.`
    )
  },

  networkError: () => {
    notifications.error('Network error. Please check your connection and try again.')
  },

  // Calendar notifications
  projectScheduled: (projectName: string, startDate: string) => {
    notifications.success(`Project "${projectName}" scheduled to start on ${startDate}`)
  },

  deadlineApproaching: (projectName: string, daysRemaining: number) => {
    notifications.warning(
      `Project "${projectName}" deadline in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
    )
  },

  deadlineOverdue: (projectName: string, daysOverdue: number) => {
    notifications.error(
      `Project "${projectName}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`
    )
  }
}
