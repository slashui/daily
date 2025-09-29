import { useState, useEffect } from 'react'
import { Project, CreateProjectData } from '../types'
import { projectsAPI } from '../utils/api'
import ProjectCard from '../components/ProjectCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FolderOpen } from 'lucide-react'

function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState<CreateProjectData>({
    name: '',
    description: ''
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await projectsAPI.getAll()
      // Sort by days_since_update (least recently updated first)
      const sorted = data.sort((a, b) => (b.days_since_update || 0) - (a.days_since_update || 0))
      setProjects(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    try {
      const project = await projectsAPI.create(newProject)
      setProjects([project, ...projects])
      setNewProject({ name: '', description: '' })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    }
  }

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
  }

  const handleProjectDelete = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {error}</div>
          <Button
            onClick={loadProjects}
            variant="link"
            className="mt-2 h-auto p-0 text-destructive hover:text-destructive/80"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            项目看板
          </h1>
          <p className="text-muted-foreground mt-1">管理和跟踪您的所有项目进展</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          新建项目
        </Button>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">创建新项目</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    项目名称 *
                  </label>
                  <Input
                    type="text"
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="输入项目名称"
                    className="bg-background border-border focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground">
                    项目描述
                  </label>
                  <Textarea
                    id="description"
                    value={newProject.description || ''}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="输入项目描述（可选）"
                    className="bg-background border-border focus:border-primary"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    创建项目
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewProject({ name: '', description: '' })
                    }}
                    className="border-border hover:bg-accent"
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
          <Card className="text-center py-12 border-border bg-card">
            <CardContent className="space-y-4">
              <div className="text-muted-foreground text-lg">还没有项目</div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                创建你的第一个项目
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onProjectUpdate={handleProjectUpdate}
                onProjectDelete={handleProjectDelete}
              />
            ))}
          </div>
        )}
    </div>
  )
}

export default ProjectDashboard