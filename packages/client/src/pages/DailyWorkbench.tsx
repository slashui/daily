import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Project, Todo, CreateTodoData, CreateLogData } from '../types'
import { projectsAPI, todosAPI, logsAPI, dailyWorkbenchAPI } from '../utils/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Plus, Clock, CheckCircle2, X, Calendar } from 'lucide-react'

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
        <div className="text-muted-foreground">Loading workbench...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {error}</div>
          <Button
            onClick={loadProjectsAndTodos}
            variant="link"
            className="mt-2 h-auto p-0 text-destructive hover:text-destructive/80"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Get unique projects involved in today's todos
  const involvedProjects = Array.from(new Set(
    todayTodos.map(todo => todo.project).filter(Boolean)
  )) as Project[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            今日工作台
          </h1>
          <p className="text-muted-foreground mt-1">专注处理今天的重要任务</p>
        </div>
        <div className="flex space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                快速添加任务
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">添加任务到今日</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Mode Selection */}
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="addMode"
                      value="new"
                      checked={addMode === 'new'}
                      onChange={() => {
                        setAddMode('new')
                        setSelectedExistingTodo('')
                      }}
                      className="text-primary border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">创建新任务</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="addMode"
                      value="existing"
                      checked={addMode === 'existing'}
                      onChange={() => {
                        setAddMode('existing')
                        setQuickTodoContent('')
                      }}
                      className="text-primary border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">选择现有任务</span>
                  </label>
                </div>

                {/* Project Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">选择项目 *</label>
                  <select
                    value={selectedProjectForQuickAdd}
                    onChange={(e) => {
                      setSelectedProjectForQuickAdd(e.target.value)
                      setSelectedExistingTodo('')
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                    disabled={quickAddLoading}
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">任务内容 *</label>
                    <Input
                      value={quickTodoContent}
                      onChange={(e) => setQuickTodoContent(e.target.value)}
                      placeholder="输入任务内容..."
                      className="bg-background border-border focus:border-primary"
                      disabled={quickAddLoading}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">选择现有任务 *</label>
                    <select
                      value={selectedExistingTodo}
                      onChange={(e) => setSelectedExistingTodo(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                      disabled={quickAddLoading || !selectedProjectForQuickAdd}
                    >
                      <option value="">选择一个任务...</option>
                      {getAvailableTodos().map((todo) => (
                        <option key={todo.id} value={todo.id}>
                          {todo.content}
                        </option>
                      ))}
                    </select>
                    {selectedProjectForQuickAdd && getAvailableTodos().length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        该项目没有可用的未完成任务
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuickAdd(false)
                    setQuickTodoContent('')
                    setSelectedProjectForQuickAdd('')
                    setSelectedExistingTodo('')
                    setAddMode('new')
                  }}
                  className="border-border hover:bg-accent"
                >
                  取消
                </Button>
                <Button
                  onClick={handleQuickAddTodo}
                  disabled={
                    quickAddLoading ||
                    (addMode === 'new' && (!quickTodoContent.trim() || !selectedProjectForQuickAdd)) ||
                    (addMode === 'existing' && !selectedExistingTodo)
                  }
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {quickAddLoading ? '添加中...' : addMode === 'new' ? '创建并添加' : '添加到今日'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {todayTodos.length > 0 && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  for (const todo of todayTodos) {
                    await dailyWorkbenchAPI.removeTodo(todo.id)
                  }
                  await loadProjectsAndTodos()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to clear todos')
                }
              }}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-2" />
              清空今日任务
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Todos */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              今日待办 ({todayTodos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTodos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg mb-4">
                  还没有添加今天的任务
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    在项目详情页选择要今天处理的任务，或者
                  </p>
                  <Button
                    onClick={() => setShowQuickAdd(true)}
                    variant="link"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    快速添加新任务
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/20 transition-colors"
                  >
                    <Checkbox
                      checked={todo.is_completed}
                      onCheckedChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                      className="border-primary/60 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
                    />
                    <span
                      className={`flex-1 ${
                        todo.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {todo.content}
                    </span>
                    {todo.project && (
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        <Link to={`/project/${todo.project.id}`} className="hover:underline">
                          {todo.project.name}
                        </Link>
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await dailyWorkbenchAPI.removeTodo(todo.id)
                          await loadProjectsAndTodos()
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to remove todo')
                        }
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Log Pad */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">项目日志</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  选择项目
                </label>
                <select
                  value={selectedProjectForLog}
                  onChange={(e) => setSelectedProjectForLog(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  日志内容
                </label>
                <Textarea
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  placeholder="记录工作心得、遇到的问题、解决方案..."
                  rows={4}
                  className="bg-background border-border focus:border-primary"
                  disabled={logLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={logLoading || !logContent.trim() || !selectedProjectForLog}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {logLoading ? '保存中...' : '保存日志'}
              </Button>
            </form>

            {involvedProjects.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">今日涉及的项目</h3>
                <div className="space-y-2">
                  {involvedProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="block px-3 py-2 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary/20 text-sm transition-colors"
                    >
                      {project.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export default DailyWorkbench