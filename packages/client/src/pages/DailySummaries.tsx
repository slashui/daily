import { useState, useEffect } from 'react'
import { dailySummariesAPI } from '../utils/api'

interface DailySummary {
  id: string
  summary_date: string
  completed_todos: Array<{
    id: string
    content: string
    project_name: string
    completed_at: string
  }>
  pending_todos: Array<{
    id: string
    content: string
    project_name: string
  }>
  total_count: number
  completed_count: number
  created_at: string
}

function DailySummaries() {
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadSummaries()
  }, [])

  const loadSummaries = async () => {
    try {
      setLoading(true)
      const data = await dailySummariesAPI.getAll()
      setSummaries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summaries')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true)
      await dailySummariesAPI.generate()
      await loadSummaries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getCompletionRate = (summary: DailySummary) => {
    if (summary.total_count === 0) return 0
    return Math.round((summary.completed_count / summary.total_count) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading summaries...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">Error: {error}</div>
        <button
          onClick={loadSummaries}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">往日任务总结</h1>
          <p className="text-gray-600 mt-1">查看历史工作台任务的完成情况</p>
        </div>
        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isGenerating ? '生成中...' : '生成今日总结'}
        </button>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            还没有任务总结
          </div>
          <p className="text-gray-400 text-sm mb-6">
            每天凌晨1点会自动生成前一天的任务总结，你也可以手动生成
          </p>
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isGenerating ? '生成中...' : '生成今日总结'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summaries List */}
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
                  selectedSummary?.id === summary.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelectedSummary(summary)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {formatDate(summary.summary_date)}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      getCompletionRate(summary) >= 80
                        ? 'bg-green-100 text-green-700'
                        : getCompletionRate(summary) >= 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {getCompletionRate(summary)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    完成 {summary.completed_count} / {summary.total_count} 个任务
                  </span>
                  <span>{summary.summary_date}</span>
                </div>

                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${getCompletionRate(summary)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Details */}
          <div className="bg-white rounded-lg shadow p-6">
            {selectedSummary ? (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {formatDate(selectedSummary.summary_date)} 详情
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSummary.completed_count}
                    </div>
                    <div className="text-sm text-green-700">已完成</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedSummary.total_count - selectedSummary.completed_count}
                    </div>
                    <div className="text-sm text-yellow-700">未完成</div>
                  </div>
                </div>

                {/* Completed Tasks */}
                {selectedSummary.completed_todos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      已完成任务 ({selectedSummary.completed_todos.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedSummary.completed_todos.map((todo, index) => (
                        <div key={index} className="flex items-center p-2 bg-green-50 rounded">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{todo.content}</div>
                            <div className="text-xs text-gray-500">{todo.project_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Tasks */}
                {selectedSummary.pending_todos.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      未完成任务 ({selectedSummary.pending_todos.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedSummary.pending_todos.map((todo, index) => (
                        <div key={index} className="flex items-center p-2 bg-yellow-50 rounded">
                          <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{todo.content}</div>
                            <div className="text-xs text-gray-500">{todo.project_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  选择一个日期查看详细信息
                </div>
                <p className="text-gray-400 text-sm">
                  点击左侧的任务总结卡片查看详情
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DailySummaries