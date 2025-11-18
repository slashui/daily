import { useState } from 'react'
import { parseMarkdown } from '../utils/markdown'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  onCancel?: () => void
  placeholder?: string
  showPreview?: boolean
  isLoading?: boolean
}

function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "输入 Markdown 内容...",
  showPreview = false,
  isLoading = false
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="border border-border rounded-md bg-card">
      {/* Tab Headers */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'edit'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          预览
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3 bg-background">
        {activeTab === 'edit' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={12}
            className="w-full resize-none border-0 focus:outline-none focus:ring-0 p-0 font-mono text-sm bg-background text-foreground placeholder:text-muted-foreground"
            style={{ minHeight: '200px' }}
          />
        ) : (
          <div
            className="min-h-[200px] text-sm prose prose-invert prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) || '<p class="text-muted-foreground">暂无内容</p>' }}
          />
        )}
      </div>

      {/* Action Buttons */}
      {(onSave || onCancel) && (
        <div className="border-t border-border p-3 flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-foreground bg-background border border-border rounded-md hover:bg-accent"
            >
              取消
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 disabled:bg-primary/50"
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default MarkdownEditor