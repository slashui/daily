import { useState, useEffect } from 'react'
import { knowledgeAPI } from '../utils/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Plus, Edit, Trash2, Search, Clock } from 'lucide-react'

interface Knowledge {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

function KnowledgeBase() {
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadKnowledge()
  }, [])

  const loadKnowledge = async () => {
    try {
      setLoading(true)
      const data = await knowledgeAPI.getAll()
      setKnowledgeList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return

    try {
      setSaving(true)
      if (editingId) {
        // Update existing
        const updated = await knowledgeAPI.update(editingId, {
          title: title.trim(),
          content: content.trim()
        })
        setKnowledgeList(knowledgeList.map(k => k.id === editingId ? updated : k))
      } else {
        // Create new
        const created = await knowledgeAPI.create({
          title: title.trim(),
          content: content.trim()
        })
        setKnowledgeList([created, ...knowledgeList])
      }

      // Reset form
      setTitle('')
      setContent('')
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save knowledge')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (knowledge: Knowledge) => {
    setEditingId(knowledge.id)
    setTitle(knowledge.title)
    setContent(knowledge.content)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此知识条目？')) return

    try {
      await knowledgeAPI.delete(id)
      setKnowledgeList(knowledgeList.filter(k => k.id !== id))

      // If deleting the item being edited, reset form
      if (editingId === id) {
        setTitle('')
        setContent('')
        setEditingId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete knowledge')
    }
  }

  const handleCancel = () => {
    setTitle('')
    setContent('')
    setEditingId(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter knowledge by search term
  const filteredKnowledge = knowledgeList.filter(k =>
    k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading knowledge base...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {error}</div>
          <Button
            onClick={loadKnowledge}
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
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          工作知识库
        </h1>
        <p className="text-muted-foreground mt-1">记录和管理工作相关的知识、经验和技巧</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {editingId ? '编辑知识' : '新建知识'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">标题</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入知识标题..."
                className="bg-background border-border focus:border-primary"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">内容</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入知识内容..."
                rows={12}
                className="bg-background border-border focus:border-primary resize-none"
                disabled={saving}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : editingId ? '保存修改' : '保存新建'}
              </Button>
              {editingId && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-border hover:bg-accent"
                >
                  取消
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Knowledge List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索标题或内容..."
              className="pl-10 bg-background border-border focus:border-primary"
            />
          </div>

          {/* Knowledge List */}
          {filteredKnowledge.length === 0 ? (
            <Card className="border-border bg-card text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg mb-2">
                  {searchTerm ? '没有找到匹配的知识条目' : '还没有添加知识条目'}
                </div>
                {!searchTerm && (
                  <p className="text-muted-foreground text-sm">
                    在左侧填写标题和内容，点击保存即可创建
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredKnowledge.map((knowledge) => (
                <Card key={knowledge.id} className="border-border bg-card">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {knowledge.title}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(knowledge)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(knowledge.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-foreground whitespace-pre-wrap mb-3">
                      {knowledge.content}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        创建: {formatDate(knowledge.created_at)}
                      </div>
                      {knowledge.updated_at !== knowledge.created_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          更新: {formatDate(knowledge.updated_at)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KnowledgeBase
