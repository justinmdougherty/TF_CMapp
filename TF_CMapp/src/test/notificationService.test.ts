import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock react-hot-toast using the factory function pattern
vi.mock('react-hot-toast', () => {
  const mockFunctions = {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  }
  
  const mockToast = vi.fn()
  Object.assign(mockToast, mockFunctions)
  
  return {
    default: mockToast,
    Toaster: vi.fn(),
  }
})

import { notifications, projectNotifications } from '../services/notificationService'
import toast from 'react-hot-toast'

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic notifications', () => {
    it('should call toast.success for success notifications', () => {
      notifications.success('Test success message')
      
      expect(toast.success).toHaveBeenCalledWith(
        'Test success message',
        expect.objectContaining({
          duration: 4000,
          position: 'top-right',
          style: expect.objectContaining({
            background: '#4caf50',
            color: 'white',
          })
        })
      )
    })

    it('should call toast.error for error notifications with longer duration', () => {
      notifications.error('Test error message')
      
      expect(toast.error).toHaveBeenCalledWith(
        'Test error message',
        expect.objectContaining({
          duration: 6000, // Longer duration for errors
          style: expect.objectContaining({
            background: '#f44336',
            color: 'white',
          })
        })
      )
    })
  })

  describe('Project-specific notifications', () => {
    it('should show success notification for project creation', () => {
      projectNotifications.projectCreated('Test Project')
      
      expect(toast.success).toHaveBeenCalledWith(
        'Project "Test Project" created successfully',
        expect.any(Object)
      )
    })

    it('should show success notification for status updates', () => {
      projectNotifications.statusUpdated('Test Project', 'Active')
      
      expect(toast.success).toHaveBeenCalledWith(
        'Project "Test Project" status updated to Active',
        expect.any(Object)
      )
    })

    it('should show warning notification for low stock', () => {
      projectNotifications.inventoryLowStock('Test Part', 5, 10)
      
      expect(toast).toHaveBeenCalledWith(
        'Low stock alert: Test Part (5 remaining, minimum: 10)',
        expect.objectContaining({
          icon: '⚠️',
          style: expect.objectContaining({
            background: '#ff9800',
            color: 'white',
          })
        })
      )
    })
  })

  describe('Promise-based notifications', () => {
    it('should handle successful promises', async () => {
      const successfulPromise = Promise.resolve('success')
      
      await notifications.promise(
        successfulPromise,
        {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        }
      )
      
      expect(toast.promise).toHaveBeenCalledWith(
        successfulPromise,
        {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        },
        expect.any(Object)
      )
    })
  })
})
