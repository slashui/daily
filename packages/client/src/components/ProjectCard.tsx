import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Project } from '../types'
import { projectsAPI } from '../utils/api'

interface ProjectCardProps {
  project: Project
  onProjectUpdate?: (project: Project) => void
  onProjectDelete?: (projectId: string) => void
}

function ProjectCard({ project, onProjectUpdate, onProjectDelete }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
      setShowDeleteConfirm(false)
    }
  }

  const handleCancel = () => {
    setEditName(project.name)
    setEditDescription(project.description || '')
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getDaysUpdateIndicator = (days: number) => {
    if (days === 0) {
      return <span className="text-green-600 text-sm font-medium">今天更新</span>
    } else if (days === 1) {
      return <span className="text-blue-600 text-sm font-medium">1天前更新</span>
    } else if (days <= 7) {
      return <span className="text-orange-600 text-sm font-medium">{days}天前更新</span>
    } else {
      return <span className="text-red-600 text-sm font-medium">{days}天未更新</span>
    }
  }

  const completedTodos = project.todos.filter(todo => todo.is_completed).length
  const totalTodos = project.todos.length

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 relative">
      {/* Edit/Delete buttons */}
      {!isEditing && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsEditing(true)
            }}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="编辑项目"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              setShowDeleteConfirm(true)
            }}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="删除项目"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="项目名称"
              />
            </div>
            <div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="项目描述"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading || !editName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Link to={`/project/${project.id}`} className="block p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-16">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                project.status
              )}`}
            >
              {project.status}
            </span>
          </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">任务进度:</span>
            <span className="text-gray-900 font-medium">
              {completedTodos}/{totalTodos} 完成
            </span>
          </div>

          {totalTodos > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(completedTodos / totalTodos) * 100}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">日志记录:</span>
            <span className="text-gray-900 text-sm font-medium">
              {project.dailyLogs.length} 条
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100">
            {getDaysUpdateIndicator(project.days_since_update || 0)}
          </div>
        </div>
        </Link>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认隐藏项目</h3>
            <p className="text-gray-600 mb-6">
              确定要隐藏项目 <strong>"{project.name}"</strong> 吗？隐藏后项目将不在列表中显示，但数据不会丢失。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                {isLoading ? '隐藏中...' : '确认隐藏'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectCard