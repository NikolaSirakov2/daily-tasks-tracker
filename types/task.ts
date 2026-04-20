export type TaskStatus = 'Todo' | 'In Progress' | 'Done' | 'Cancelled'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Task {
  id: string
  task_name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  category?: string
  due_date?: string
  notes?: string
  sheet_row?: number
  synced_at?: string
  created_at: string
  updated_at: string
}

export interface TaskFormData {
  task_name: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  category: string
  due_date: string
  notes: string
}
