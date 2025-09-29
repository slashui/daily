import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Project, Todo, CreateTodoData, CreateLogData } from '../types'
import { projectsAPI, todosAPI, logsAPI, dailyWorkbenchAPI } from '../utils/api'

function DailyWorkbench() {
  const [projects, setProjects] = useState<Project[]>([])
  const [todayTodos, setTodayTodos] = useState<(Todo & { project?: Project })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Quick add todo state
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickTodoContent, setQuickTodoContent] = useState('')
  const [selectedProjectForQuickAdd, setSelectedProjectForQuickAdd] = useState('')
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new') // 添加模式：新建或选择现有
  const [selectedExistingTodo, setSelectedExistingTodo] = useState('')

  // Project log state
  const [selectedProjectForLog, setSelectedProjectForLog] = useState('')
  const [logContent, setLogContent] = useState('')
  const [logLoading, setLogLoading] = useState(false)

  useEffect(() => {
    loadProjectsAndTodos()
  }, [])

  const loadProjectsAndTodos = async () => {
    try {
      setLoading(true)
      // Load both projects and today's todos in parallel
      const [projectsData, todayTodosData] = await Promise.all([
        projectsAPI.getAll(),
        dailyWorkbenchAPI.getTodayTodos()
      ])
      setProjects(projectsData)
      setTodayTodos(todayTodosData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTodo = async (todoId: string, currentStatus: boolean) => {
    try {
      const updatedTodo = await todosAPI.update(todoId, { is_completed: !currentStatus })

      // Update projects state
      setProjects(projects.map(project => ({
        ...project,
        todos: project.todos.map(todo =>
          todo.id === todoId ? updatedTodo : todo
        )
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    }
  }

  const handleQuickAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (addMode === 'new') {
      if (!quickTodoContent.trim() || !selectedProjectForQuickAdd) return

      try {
        setQuickAddLoading(true)
        const todoData: CreateTodoData = {
          project_id: selectedProjectForQuickAdd,
          content: quickTodoContent.trim()
        }

        const newTodo = await todosAPI.create(todoData)

        // Update projects state
        setProjects(projects.map(project =>
          project.id === selectedProjectForQuickAdd
            ? { ...project, todos: [newTodo, ...project.todos] }
            : project
        ))

        // Reset form
        setQuickTodoContent('')
        setSelectedProjectForQuickAdd('')
        setShowQuickAdd(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create todo')
      } finally {
        setQuickAddLoading(false)
      }
    } else {
      // 选择现有任务
      if (!selectedExistingTodo) return

      try {
        // 使用后端API添加现有任务到今日工作台
        await dailyWorkbenchAPI.addTodo(selectedExistingTodo)
        // 重新加载今日任务数据
        await loadProjectsAndTodos()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add todo to workbench')
      }

      // Reset form
      setSelectedExistingTodo('')
      setSelectedProjectForQuickAdd('')
      setShowQuickAdd(false)
    }
  }

  // 获取选中项目的未完成任务
  const getAvailableTodos = () => {
    if (!selectedProjectForQuickAdd) return []
    const selectedProject = projects.find(p => p.id === selectedProjectForQuickAdd)
    const todayTodoIds = todayTodos.map(t => t.id)
    return selectedProject?.todos.filter(todo =>
      !todo.is_completed && !todayTodoIds.includes(todo.id)
    ) || []
  }

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logContent.trim() || !selectedProjectForLog) return

    try {
      setLogLoading(true)
      const logData: CreateLogData = {
        project_id: selectedProjectForLog,
        content: logContent.trim()
      }

      const newLog = await logsAPI.create(logData)

      // Update projects state
      setProjects(projects.map(project =>
        project.id === selectedProjectForLog
          ? { ...project, dailyLogs: [newLog, ...project.dailyLogs] }
          : project
      ))

      // Reset form
      setLogContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create log')
    } finally {
      setLogLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workbench...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">Error: {error}</div>
        <button
          onClick={loadProjectsAndTodos}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  // Get unique projects involved in today's todos
  const involvedProjects = Array.from(new Set(
    todayTodos.map(todo => todo.project).filter(Boolean)
  )) as Project[]

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">今日工作台</h1>
          <p className="text-gray-600 mt-1">专注处理今天的重要任务</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            快速添加任务
          </button>
          {todayTodos.length > 0 && (
            <button
              onClick={async () => {
                try {
                  // 逐个移除所有今日任务
                  for (const todo of todayTodos) {
                    await dailyWorkbenchAPI.removeTodo(todo.id)
                  }
                  await loadProjectsAndTodos()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to clear todos')
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              清空今日任务
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Todos */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              今日待办 ({todayTodos.length})
            </h2>
          </div>

          {todayTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                还没有添加今天的任务
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  在项目详情页选择要今天处理的任务，或者
                </p>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  快速添加新任务
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={todo.is_completed}
                    onChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <span
                    className={`flex-1 ${
                      todo.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {todo.content}
                  </span>
                  {todo.project && (
                    <Link
                      to={`/project/${todo.project.id}`}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-300 hover:bg-blue-200"
                    >
                      {todo.project.name}
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await dailyWorkbenchAPI.removeTodo(todo.id)
                        await loadProjectsAndTodos()
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to remove todo')
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Log Pad */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">项目日志</h2>

          <form onSubmit={handleCreateLog} className="space-y-4">
            <div>
              <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1">
                选择项目
              </label>
              <select
                id="project-select"
                value={selectedProjectForLog}
                onChange={(e) => setSelectedProjectForLog(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={logLoading}
              >
                <option value="">选择一个项目...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="log-content" className="block text-sm font-medium text-gray-700 mb-1">
                日志内容
              </label>
              <textarea
                id="log-content"
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                placeholder="记录工作心得、遇到的问题、解决方案..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={logLoading}
              />
            </div>

            <button
              type="submit"
              disabled={logLoading || !logContent.trim() || !selectedProjectForLog}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logLoading ? '保存中...' : '保存日志'}
            </button>
          </form>

          {involvedProjects.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">今日涉及的项目</h3>
              <div className="space-y-2">
                {involvedProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="block px-3 py-2 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 text-sm"
                  >
                    {project.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Todo Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加任务到今日</h3>

            {/* 模式选择 */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="addMode"
                    value="new"
                    checked={addMode === 'new'}
                    onChange={(e) => {
                      setAddMode('new')
                      setSelectedExistingTodo('')
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">创建新任务</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="addMode"
                    value="existing"
                    checked={addMode === 'existing'}
                    onChange={(e) => {
                      setAddMode('existing')
                      setQuickTodoContent('')
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">选择现有任务</span>
                </label>
              </div>
            </div>

            <form onSubmit={handleQuickAddTodo} className="space-y-4">
              <div>
                <label htmlFor="quick-project" className="block text-sm font-medium text-gray-700 mb-1">
                  选择项目 *
                </label>
                <select
                  id="quick-project"
                  value={selectedProjectForQuickAdd}
                  onChange={(e) => {
                    setSelectedProjectForQuickAdd(e.target.value)
                    setSelectedExistingTodo('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={quickAddLoading}
                  required
                >
                  <option value="">选择一个项目...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {addMode === 'new' ? (
                <div>
                  <label htmlFor="quick-content" className="block text-sm font-medium text-gray-700 mb-1">
                    任务内容 *
                  </label>
                  <input
                    type="text"
                    id="quick-content"
                    value={quickTodoContent}
                    onChange={(e) => setQuickTodoContent(e.target.value)}
                    placeholder="输入任务内容..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={quickAddLoading}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="existing-todo" className="block text-sm font-medium text-gray-700 mb-1">
                    选择现有任务 *
                  </label>
                  <select
                    id="existing-todo"
                    value={selectedExistingTodo}
                    onChange={(e) => setSelectedExistingTodo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={quickAddLoading || !selectedProjectForQuickAdd}
                    required
                  >
                    <option value="">选择一个任务...</option>
                    {getAvailableTodos().map((todo) => (
                      <option key={todo.id} value={todo.id}>
                        {todo.content}
                      </option>
                    ))}
                  </select>
                  {selectedProjectForQuickAdd && getAvailableTodos().length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      该项目没有可用的未完成任务
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={
                    quickAddLoading ||
                    (addMode === 'new' && (!quickTodoContent.trim() || !selectedProjectForQuickAdd)) ||
                    (addMode === 'existing' && !selectedExistingTodo)
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quickAddLoading ? '添加中...' : addMode === 'new' ? '创建并添加' : '添加到今日'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false)
                    setQuickTodoContent('')
                    setSelectedProjectForQuickAdd('')
                    setSelectedExistingTodo('')
                    setAddMode('new')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyWorkbench