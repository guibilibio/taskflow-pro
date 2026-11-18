export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type Task = {
  id: number
  title: string
  completed: boolean
  createdAt: string

  description: string | null
  scheduledDate: string | null
  startTime: string | null
  endTime: string | null
  priority: TaskPriority
}