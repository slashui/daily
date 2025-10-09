import { Project, Todo, DailyLog, CreateProjectData, UpdateProjectData, CreateTodoData, CreateLogData, UpdateTodoData } from '../types'

const API_BASE_URL = 'https://project-workbench-api.bassnova.workers.dev/api'

class APIError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'APIError'
  }
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new APIError(
      errorData.error || `HTTP Error: ${response.status}`,
      response.status
    )
  }

  return response.json()
}

// Projects API
export const projectsAPI = {
  getAll: (): Promise<Project[]> =>
    apiRequest('/projects'),

  getById: (id: string): Promise<Project> =>
    apiRequest(`/projects/${id}`),

  create: (data: CreateProjectData): Promise<Project> =>
    apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProjectData): Promise<Project> =>
    apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    }),
}

// Todos API
export const todosAPI = {
  create: (data: CreateTodoData): Promise<Todo> =>
    apiRequest('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTodoData): Promise<Todo> =>
    apiRequest(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/todos/${id}`, {
      method: 'DELETE',
    }),
}

// Daily Logs API
export const logsAPI = {
  create: (data: CreateLogData): Promise<DailyLog> =>
    apiRequest('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/logs/${id}`, {
      method: 'DELETE',
    }),
}

// Daily Workbench API
export const dailyWorkbenchAPI = {
  getTodayTodos: (): Promise<(Todo & { project?: Project })[]> =>
    apiRequest('/daily-workbench'),

  addTodo: (todoId: string): Promise<{ message: string; todo: Todo & { project?: Project } }> =>
    apiRequest('/daily-workbench/add', {
      method: 'POST',
      body: JSON.stringify({ todo_id: todoId }),
    }),

  removeTodo: (todoId: string): Promise<{ message: string }> =>
    apiRequest('/daily-workbench/remove', {
      method: 'DELETE',
      body: JSON.stringify({ todo_id: todoId }),
    }),

  getHistoryByDate: (date: string): Promise<{ date: string; todos: (Todo & { project?: Project })[] }> =>
    apiRequest(`/daily-workbench/history/${date}`),
}

// Daily Summaries API
export const dailySummariesAPI = {
  getAll: (): Promise<any[]> =>
    apiRequest('/daily-summaries'),

  getByDate: (date: string): Promise<any> =>
    apiRequest(`/daily-summaries/${date}`),

  generate: (date?: string): Promise<{ message: string; date: string }> =>
    apiRequest('/daily-summaries/generate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  updateManualSummary: (date: string, manualSummary: string): Promise<any> =>
    apiRequest(`/daily-summaries/${date}/manual`, {
      method: 'PUT',
      body: JSON.stringify({ manual_summary: manualSummary }),
    }),
}

// Knowledge Base API
export const knowledgeAPI = {
  getAll: (): Promise<any[]> =>
    apiRequest('/knowledge'),

  create: (data: { title: string; content: string }): Promise<any> =>
    apiRequest('/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; content?: string }): Promise<any> =>
    apiRequest(`/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiRequest(`/knowledge/${id}`, {
      method: 'DELETE',
    }),
}