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
    <div className="border border-gray-300 rounded-md">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'edit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          预览
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3">
        {activeTab === 'edit' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={12}
            className="w-full resize-none border-0 focus:outline-none focus:ring-0 p-0 font-mono text-sm"
            style={{ minHeight: '200px' }}
          />
        ) : (
          <div
            className="min-h-[200px] text-sm"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) || '<p class="text-gray-500">暂无内容</p>' }}
          />
        )}
      </div>

      {/* Action Buttons */}
      {(onSave || onCancel) && (
        <div className="border-t border-gray-200 p-3 flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400"
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