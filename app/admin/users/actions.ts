"use server"

// Import all functions from their respective modules
import {
  getUsers,
  getUser,
  createUser,
  updateUser
} from './actions/user-crud.actions'

import { deleteUser } from './actions/user-delete.actions'

import {
  updateUserStatus,
  bulkUpdateUserStatus
} from './actions/user-status.actions'

import {
  bulkDeleteUsers,
  exportUsersToCSV
} from './actions/user-bulk.actions'

import {
  logUserActivity,
  getUserActivityLogs
} from './actions/user-activity.actions'

import {
  uploadUserPhoto,
  deleteUserPhoto
} from './actions/user-photo.actions'

import {
  sendPasswordResetEmail,
  toggleUser2FA,
  bulkDisable2FA,
  bulkSendPasswordReset,
  sendVerificationEmail,
  bulkSendVerificationEmails
} from './actions/user-auth.actions'

// Re-export all functions
export {
  // CRUD operations
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  
  // Status management
  updateUserStatus,
  bulkUpdateUserStatus,
  
  // Bulk operations
  bulkDeleteUsers,
  exportUsersToCSV,
  
  // Activity logging
  logUserActivity,
  getUserActivityLogs,
  
  // Photo management
  uploadUserPhoto,
  deleteUserPhoto,
  
  // Authentication & security
  sendPasswordResetEmail,
  toggleUser2FA,
  bulkDisable2FA,
  bulkSendPasswordReset,
  sendVerificationEmail,
  bulkSendVerificationEmails
}