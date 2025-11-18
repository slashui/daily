export interface Project {
  id: string
  name: string
  description: string | null
  requirements: string | null
  readme: string | null
  status: 'active' | 'archived' | 'on-hold'
  is_hidden: boolean
  created_at: string
  last_updated_at: string
  days_since_update?: number
  todos: Todo[]
  dailyLogs: DailyLog[]
  projectLogs: ProjectLog[]
}

export interface Todo {
  id: string
  project_id: string
  content: string
  is_completed: boolean
  due_date: string | null
  created_at: string
  completed_at: string | null
  project?: Project
}

export interface DailyLog {
  id: string
  project_id: string
  content: string
  log_date: string
  created_at: string
  project?: Project
}

export interface ProjectLog {
  id: string
  project_id: string
  content: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  log_date: string
  created_at: string
  project?: Project
}

export interface CreateProjectData {
  name: string
  description?: string
  requirements?: string
  readme?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
  requirements?: string
  readme?: string
  status?: 'active' | 'archived' | 'on-hold'
}

export interface CreateTodoData {
  project_id: string
  content: string
  due_date?: string
}

export interface CreateLogData {
  project_id: string
  content: string
}

export interface CreateProjectLogData {
  project_id: string
  content: string
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked'
}

export interface UpdateProjectLogData {
  content?: string
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked'
}

export interface UpdateTodoData {
  is_completed: boolean
}