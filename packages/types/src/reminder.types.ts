export interface Reminder {
  id: string
  scheduledAt: string
  sent: boolean
  message: string | null
  createdAt: string
  userId: string
  applicationId: string
}

export interface CreateReminderPayload {
  scheduledAt: string
  message?: string
  applicationId: string
}
