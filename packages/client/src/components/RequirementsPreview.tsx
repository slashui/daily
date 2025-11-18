import { useState, useEffect } from 'react'
import { parseMarkdown } from '../utils/markdown'

interface RequirementsPreviewProps {
  requirements: string | null
  isVisible: boolean
  onClose: () => void
}

function RequirementsPreview({ requirements, isVisible, onClose }: RequirementsPreviewProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => onClose(), 300) // Match transition duration
  }

  if (!isVisible && !isAnimating) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-card border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">项目需求</h2>
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-full overflow-y-auto pb-20">
          {requirements ? (
            <div
              className="prose prose-invert prose-slate prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(requirements) }}
            />
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-center">
                暂无项目需求<br />
                <span className="text-sm">可在项目详情页面添加</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default RequirementsPreview