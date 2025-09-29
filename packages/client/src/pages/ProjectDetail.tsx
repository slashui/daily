import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Project, CreateTodoData, CreateLogData } from '../types'
import { projectsAPI, todosAPI, logsAPI, dailyWorkbenchAPI } from '../utils/api'
import MarkdownEditor from '../components/MarkdownEditor'
import RequirementsPreview from '../components/RequirementsPreview'

function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Todo form state
  const [newTodoContent, setNewTodoContent] = useState('')
  const [todoLoading, setTodoLoading] = useState(false)

  // Log form state
  const [newLogContent, setNewLogContent] = useState('')
  const [logLoading, setLogLoading] = useState(false)

  // Requirements state
  const [isEditingRequirements, setIsEditingRequirements] = useState(false)
  const [requirementsContent, setRequirementsContent] = useState('')
  const [requirementsLoading, setRequirementsLoading] = useState(false)
  const [showRequirementsPreview, setShowRequirementsPreview] = useState(false)

  // Today's workbench todos (to check if todo is in today's list)
  const [todayTodos, setTodayTodos] = useState<string[]>([])

  useEffect(() => {
    if (id) {
      loadProject(id)
      loadTodayTodos()
    }
  }, [id])

  const loadProject = async (projectId: string) => {
    try {
      setLoading(true)
      const data = await projectsAPI.getById(projectId)
      setProject(data)
      setRequirementsContent(data.requirements || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const loadTodayTodos = async () => {
    try {
      const todayTodosData = await dailyWorkbenchAPI.getTodayTodos()
      setTodayTodos(todayTodosData.map(todo => todo.id))
    } catch (err) {
      // Don't show error for workbench loading failure
      console.warn('Failed to load today todos:', err)
    }
  }

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoContent.trim() || !project) return

    try {
      setTodoLoading(true)
      const todoData: CreateTodoData = {
        project_id: project.id,
        content: newTodoContent.trim()
      }

      const newTodo = await todosAPI.create(todoData)

      // Update project state
      setProject({
        ...project,
        todos: [newTodo, ...project.todos]
      })

      setNewTodoContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo')
    } finally {
      setTodoLoading(false)
    }
  }

  const handleToggleTodo = async (todoId: string, currentStatus: boolean) => {
    if (!project) return

    try {
      const updatedTodo = await todosAPI.update(todoId, { is_completed: !currentStatus })

      // Update project state
      setProject({
        ...project,
        todos: project.todos.map(todo =>
          todo.id === todoId ? updatedTodo : todo
        )
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!project || !confirm('确认删除此任务？')) return

    try {
      await todosAPI.delete(todoId)

      // Update project state
      setProject({
        ...project,
        todos: project.todos.filter(todo => todo.id !== todoId)
      })

      // Remove from workbench if it's there
      removeTodoFromToday(todoId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo')
    }
  }

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLogContent.trim() || !project) return

    try {
      setLogLoading(true)
      const logData: CreateLogData = {
        project_id: project.id,
        content: newLogContent.trim()
      }

      const newLog = await logsAPI.create(logData)

      // Update project state
      setProject({
        ...project,
        dailyLogs: [newLog, ...project.dailyLogs]
      })

      setNewLogContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create log')
    } finally {
      setLogLoading(false)
    }
  }

  const handleToggleWorkbench = async (todoId: string) => {
    const isInToday = todayTodos.includes(todoId)
    try {
      if (isInToday) {
        await dailyWorkbenchAPI.removeTodo(todoId)
        setTodayTodos(prev => prev.filter(id => id !== todoId))
      } else {
        await dailyWorkbenchAPI.addTodo(todoId)
        setTodayTodos(prev => [...prev, todoId])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workbench')
    }
  }

  const handleSaveRequirements = async () => {
    if (!project) return

    try {
      setRequirementsLoading(true)
      const updatedProject = await projectsAPI.update(project.id, {
        requirements: requirementsContent.trim() || undefined
      })
      setProject(updatedProject)
      setIsEditingRequirements(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save requirements')
    } finally {
      setRequirementsLoading(false)
    }
  }

  const handleCancelRequirements = () => {
    setRequirementsContent(project?.requirements || '')
    setIsEditingRequirements(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">Error: {error}</div>
        <button
          onClick={() => id && loadProject(id)}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">项目不存在</div>
        <Link
          to="/"
          className="mt-4 text-blue-600 hover:text-blue-800 underline inline-block"
        >
          返回项目看板
        </Link>
      </div>
    )
  }

  const completedTodos = project.todos.filter(todo => todo.is_completed).length
  const totalTodos = project.todos.length

  return (
    <div className="px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← 返回项目看板
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-1">{project.description}</p>
          )}
          <div className="mt-2 text-sm text-gray-500">
            进度: {completedTodos}/{totalTodos} 任务完成
          </div>
        </div>

        {/* Requirements buttons */}
        <div className="flex gap-2 ml-4">
          {project.requirements && (
            <button
              onClick={() => setShowRequirementsPreview(true)}
              className="px-4 py-2 text-sm bg-green-100 text-green-700 border border-green-300 rounded-md hover:bg-green-200"
            >
              查看需求
            </button>
          )}
          <button
            onClick={() => setIsEditingRequirements(true)}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 border border-blue-300 rounded-md hover:bg-blue-200"
          >
            {project.requirements ? '编辑需求' : '添加需求'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Todos Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              待办事项 ({project.todos.length})
            </h2>
          </div>

          {/* Add Todo Form */}
          <form onSubmit={handleCreateTodo} className="mb-6">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTodoContent}
                onChange={(e) => setNewTodoContent(e.target.value)}
                placeholder="添加新任务..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={todoLoading}
              />
              <button
                type="submit"
                disabled={todoLoading || !newTodoContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {todoLoading ? '添加中...' : '添加'}
              </button>
            </div>
          </form>

          {/* Todos List */}
          {project.todos.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              暂无待办事项
            </div>
          ) : (
            <div className="space-y-3">
              {project.todos.map((todo) => (
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
                  <button
                    onClick={() => handleToggleWorkbench(todo.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      todayTodos.includes(todo.id)
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    {todayTodos.includes(todo.id) ? '已加入今日' : '加入今日'}
                  </button>
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Logs Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              工作日志 ({project.dailyLogs.length})
            </h2>
          </div>

          {/* Add Log Form */}
          <form onSubmit={handleCreateLog} className="mb-6">
            <div className="space-y-2">
              <textarea
                value={newLogContent}
                onChange={(e) => setNewLogContent(e.target.value)}
                placeholder="记录今天的工作、问题或想法..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={logLoading}
              />
              <button
                type="submit"
                disabled={logLoading || !newLogContent.trim()}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logLoading ? '保存中...' : '保存日志'}
              </button>
            </div>
          </form>

          {/* Logs List */}
          {project.dailyLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              暂无工作日志
            </div>
          ) : (
            <div className="space-y-4">
              {project.dailyLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded-r-lg">
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(log.log_date).toLocaleDateString('zh-CN')} {new Date(log.log_date).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}
                  </div>
                  <div className="text-gray-900 whitespace-pre-wrap">{log.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Requirements Editor Modal */}
      {isEditingRequirements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {project.requirements ? '编辑项目需求' : '添加项目需求'}
              </h2>
              <button
                onClick={handleCancelRequirements}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <MarkdownEditor
                value={requirementsContent}
                onChange={setRequirementsContent}
                onSave={handleSaveRequirements}
                onCancel={handleCancelRequirements}
                placeholder="输入项目需求文档...

支持 Markdown 格式：
# 标题
## 子标题
**粗体** *斜体*
`代码`
- 列表项
1. 有序列表

```
代码块
```"
                isLoading={requirementsLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Requirements Preview Panel */}
      <RequirementsPreview
        requirements={project.requirements}
        isVisible={showRequirementsPreview}
        onClose={() => setShowRequirementsPreview(false)}
      />
    </div>
  )
}

export default ProjectDetail