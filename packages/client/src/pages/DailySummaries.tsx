import { useState, useEffect } from 'react'
import { dailySummariesAPI } from '../utils/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, CheckCircle2, Clock, History, Play, BarChart3 } from 'lucide-react'

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
        <div className="text-muted-foreground">Loading summaries...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-destructive">Error: {error}</div>
          <Button
            onClick={loadSummaries}
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
            <History className="h-8 w-8 text-primary" />
            往日任务总结
          </h1>
          <p className="text-muted-foreground mt-1">查看历史工作台任务的完成情况</p>
        </div>
        <Button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Play className="h-4 w-4 mr-2" />
          {isGenerating ? '生成中...' : '生成今日总结'}
        </Button>
      </div>

      {summaries.length === 0 ? (
        <Card className="text-center py-16 border-border bg-card">
          <CardContent className="space-y-4">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground text-lg mb-4">
              还没有任务总结
            </div>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              每天凌晨1点会自动生成前一天的任务总结，你也可以手动生成
            </p>
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              {isGenerating ? '生成中...' : '生成今日总结'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summaries List */}
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Card
                key={summary.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedSummary?.id === summary.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/20 bg-card'
                }`}
                onClick={() => setSelectedSummary(summary)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {formatDate(summary.summary_date)}
                    </h3>
                    <Badge
                      variant={getCompletionRate(summary) >= 80 ? "default" : getCompletionRate(summary) >= 50 ? "secondary" : "destructive"}
                      className={`${
                        getCompletionRate(summary) >= 80
                          ? 'bg-primary text-primary-foreground'
                          : getCompletionRate(summary) >= 50
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-destructive text-destructive-foreground'
                      }`}
                    >
                      {getCompletionRate(summary)}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span>
                      完成 {summary.completed_count} / {summary.total_count} 个任务
                    </span>
                    <span>{summary.summary_date}</span>
                  </div>

                  <Progress
                    value={getCompletionRate(summary)}
                    className="h-2 bg-muted"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Details */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              {selectedSummary ? (
                <div className="space-y-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {formatDate(selectedSummary.summary_date)} 详情
                    </CardTitle>
                  </CardHeader>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {selectedSummary.completed_count}
                      </div>
                      <div className="text-sm text-primary">已完成</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {selectedSummary.total_count - selectedSummary.completed_count}
                      </div>
                      <div className="text-sm text-muted-foreground">未完成</div>
                    </div>
                  </div>

                  {/* Completed Tasks */}
                  {selectedSummary.completed_todos.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                        已完成任务 ({selectedSummary.completed_todos.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedSummary.completed_todos.map((todo, index) => (
                          <div key={index} className="flex items-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm text-foreground">{todo.content}</div>
                              <div className="text-xs text-muted-foreground">{todo.project_name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Tasks */}
                  {selectedSummary.pending_todos.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3 flex items-center">
                        <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                        未完成任务 ({selectedSummary.pending_todos.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedSummary.pending_todos.map((todo, index) => (
                          <div key={index} className="flex items-center p-3 bg-muted/30 border border-border rounded-lg">
                            <Clock className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm text-foreground">{todo.content}</div>
                              <div className="text-xs text-muted-foreground">{todo.project_name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground text-lg mb-4">
                    选择一个日期查看详细信息
                  </div>
                  <p className="text-muted-foreground text-sm">
                    点击左侧的任务总结卡片查看详情
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default DailySummaries