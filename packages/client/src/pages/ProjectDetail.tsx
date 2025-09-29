import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Project, CreateTodoData, CreateLogData } from '../types'
import { projectsAPI, todosAPI, logsAPI, dailyWorkbenchAPI } from '../utils/api'
import MarkdownEditor from '../components/MarkdownEditor'
import RequirementsPreview from '../components/RequirementsPreview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Calendar, CheckCircle2, Clock, FileText, Edit, X, Trash2 } from 'lucide-react'

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
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {error}</div>
          <Button
            onClick={() => id && loadProject(id)}
            variant="link"
            className="mt-2 h-auto p-0 text-destructive hover:text-destructive/80"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!project) {
    return (
      <Card className="text-center py-12 border-border bg-card">
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-lg">项目不存在</div>
          <Button asChild variant="outline" className="border-border hover:bg-accent">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回项目看板
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const completedTodos = project.todos.filter(todo => todo.is_completed).length
  const totalTodos = project.todos.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button asChild variant="ghost" className="w-fit p-2 h-auto text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回项目看板
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground mt-2 text-lg">{project.description}</p>
              )}
            </div>

            {/* Progress Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">任务进度:</span>
                <span className="text-foreground font-medium">
                  {completedTodos}/{totalTodos} 完成
                </span>
              </div>
              {totalTodos > 0 && (
                <Progress
                  value={(completedTodos / totalTodos) * 100}
                  className="h-2 bg-muted"
                />
              )}
            </div>
          </div>

          {/* Requirements buttons */}
          <div className="flex gap-3 ml-6">
            {project.requirements && (
              <Button
                onClick={() => setShowRequirementsPreview(true)}
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                <FileText className="h-4 w-4 mr-2" />
                查看需求
              </Button>
            )}
            <Button
              onClick={() => setIsEditingRequirements(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Edit className="h-4 w-4 mr-2" />
              {project.requirements ? '编辑需求' : '添加需求'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Todos Section */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              待办事项 ({project.todos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Todo Form */}
            <form onSubmit={handleCreateTodo} className="flex space-x-2">
              <Input
                value={newTodoContent}
                onChange={(e) => setNewTodoContent(e.target.value)}
                placeholder="添加新任务..."
                className="flex-1 bg-background border-border focus:border-primary"
                disabled={todoLoading}
              />
              <Button
                type="submit"
                disabled={todoLoading || !newTodoContent.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {todoLoading ? '添加中...' : '添加'}
              </Button>
            </form>

            {/* Todos List */}
            {project.todos.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                暂无待办事项
              </div>
            ) : (
              <div className="space-y-3">
                {project.todos.map((todo) => (
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
                    <Badge
                      variant={todayTodos.includes(todo.id) ? "default" : "outline"}
                      className={todayTodos.includes(todo.id)
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-accent"
                      }
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleWorkbench(todo.id)}
                        className="h-auto p-0 text-inherit hover:bg-transparent"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {todayTodos.includes(todo.id) ? '已加入今日' : '加入今日'}
                      </Button>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Logs Section */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              工作日志 ({project.dailyLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Log Form */}
            <form onSubmit={handleCreateLog} className="space-y-3">
              <Textarea
                value={newLogContent}
                onChange={(e) => setNewLogContent(e.target.value)}
                placeholder="记录今天的工作、问题或想法..."
                rows={3}
                className="bg-background border-border focus:border-primary"
                disabled={logLoading}
              />
              <Button
                type="submit"
                disabled={logLoading || !newLogContent.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {logLoading ? '保存中...' : '保存日志'}
              </Button>
            </form>

            {/* Logs List */}
            {project.dailyLogs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                暂无工作日志
              </div>
            ) : (
              <div className="space-y-4">
                {project.dailyLogs.map((log) => (
                  <div key={log.id} className="border-l-4 border-primary pl-4 bg-primary/5 p-4 rounded-r-lg">
                    <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(log.log_date).toLocaleDateString('zh-CN')} {new Date(log.log_date).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div className="text-foreground whitespace-pre-wrap">{log.content}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Requirements Editor Modal */}
      {isEditingRequirements && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {project.requirements ? '编辑项目需求' : '添加项目需求'}
              </h2>
              <Button
                onClick={handleCancelRequirements}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
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