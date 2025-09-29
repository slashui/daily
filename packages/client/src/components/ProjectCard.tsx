import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Project } from '../types'
import { projectsAPI } from '../utils/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Edit2, Trash2 } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onProjectUpdate?: (project: Project) => void
  onProjectDelete?: (projectId: string) => void
}

function ProjectCard({ project, onProjectUpdate, onProjectDelete }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!editName.trim()) return

    setIsLoading(true)
    try {
      const updatedProject = await projectsAPI.update(project.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined
      })
      onProjectUpdate?.(updatedProject)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update project:', error)
      alert('更新项目失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await projectsAPI.delete(project.id)
      onProjectDelete?.(project.id)
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('删除项目失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditName(project.name)
    setEditDescription(project.description || '')
    setIsEditing(false)
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default'
      case 'on-hold':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'default'
    }
  }

  const getDaysUpdateIndicator = (days: number) => {
    if (days === 0) {
      return <span className="text-primary text-sm font-medium">今天更新</span>
    } else if (days === 1) {
      return <span className="text-primary text-sm font-medium">1天前更新</span>
    } else if (days <= 7) {
      return <span className="text-muted-foreground text-sm font-medium">{days}天前更新</span>
    } else {
      return <span className="text-destructive text-sm font-medium">{days}天未更新</span>
    }
  }

  const completedTodos = project.todos.filter(todo => todo.is_completed).length
  const totalTodos = project.todos.length

  return (
    <Card className="relative border-border bg-card hover:border-primary/20 transition-all duration-200">
      {/* Edit/Delete buttons */}
      {!isEditing && (
        <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              setIsEditing(true)
            }}
            title="编辑项目"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.preventDefault()}
                title="删除项目"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">确认隐藏项目</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground">
                确定要隐藏项目 <strong className="text-foreground">"{project.name}"</strong> 吗？隐藏后项目将不在列表中显示，但数据不会丢失。
              </p>
              <DialogFooter>
                <Button
                  onClick={handleDelete}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? '隐藏中...' : '确认隐藏'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isEditing ? (
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="项目名称"
              className="bg-background border-border focus:border-primary"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="项目描述"
              rows={3}
              className="bg-background border-border focus:border-primary"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading || !editName.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? '保存中...' : '保存'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                variant="outline"
                className="border-border hover:bg-accent"
              >
                取消
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <Link to={`/project/${project.id}`} className="block group">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4 pr-16">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
                {project.description && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{project.description}</p>
                )}
              </div>
              <Badge
                variant={getStatusVariant(project.status)}
                className={project.status === 'active'
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-border"
                }
              >
                {project.status}
              </Badge>
            </div>

            <div className="space-y-3">
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

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">日志记录:</span>
                <span className="text-foreground text-sm font-medium">
                  {project.dailyLogs.length} 条
                </span>
              </div>

              <div className="pt-2 border-t border-border">
                {getDaysUpdateIndicator(project.days_since_update || 0)}
              </div>
            </div>
          </CardContent>
        </Link>
      )}
    </Card>
  )
}

export default ProjectCard