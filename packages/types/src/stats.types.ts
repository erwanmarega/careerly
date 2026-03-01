import type { ApplicationStatus } from './application.types'

export interface StatsOverview {
  total: number
  responseRate: number
  interviewRate: number
  offerRate: number
  activeApplications: number
}

export interface StatsByStatus {
  status: ApplicationStatus
  count: number
  percentage: number
}

export interface TimelinePoint {
  date: string
  count: number
}

export interface StatsTimeline {
  data: TimelinePoint[]
}
