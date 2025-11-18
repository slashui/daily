import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Edit, Save } from 'lucide-react'
import MarkdownEditor from './MarkdownEditor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocumentViewerProps {
  isVisible: boolean
  onClose: () => void
  title: string
  content: string | null
  onSave: (content: string) => Promise<void>
  placeholder?: string
}

function DocumentViewer({ isVisible, onClose, title, content, onSave, placeholder }: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content || '')
  const [isSaving, setIsSaving] = useState(false)

  if (!isVisible) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditContent(content || '')
    setIsEditing(false)
  }

  const handleEdit = () => {
    setEditContent(content || '')
    setIsEditing(true)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-end z-50">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="relative bg-card border-l border-border h-full w-full max-w-3xl overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card/95 backdrop-blur">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <div className="flex items-center gap-2">
            {!isEditing && content && (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-88px)] overflow-y-auto p-6">
          {isEditing ? (
            <div className="space-y-4">
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                onSave={handleSave}
                onCancel={handleCancel}
                placeholder={placeholder || `输入${title}内容...\n\n支持 Markdown 格式：\n# 标题\n## 子标题\n**粗体** *斜体*\n\`代码\`\n- 列表项\n1. 有序列表\n\n\`\`\`\n代码块\n\`\`\``}
                isLoading={isSaving}
              />
            </div>
          ) : content ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-foreground mt-4 mb-2" {...props} />,
                  p: ({node, ...props}) => <p className="text-foreground mb-4 leading-7" {...props} />,
                  ul: ({node, ...props}) => <ul className="text-foreground mb-4 ml-6 list-disc" {...props} />,
                  ol: ({node, ...props}) => <ol className="text-foreground mb-4 ml-6 list-decimal" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  code: ({node, inline, ...props}: any) =>
                    inline ? (
                      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                    ) : (
                      <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4" {...props} />
                    ),
                  pre: ({node, ...props}) => <pre className="bg-muted rounded-lg overflow-hidden mb-4" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="mb-4">暂无{title}内容</p>
              <Button
                onClick={handleEdit}
                variant="outline"
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                <Edit className="h-4 w-4 mr-2" />
                添加{title}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer
