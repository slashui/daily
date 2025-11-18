import { Routes, Route, NavLink } from 'react-router-dom'
import ProjectDashboard from './pages/ProjectDashboard'
import ProjectDetail from './pages/ProjectDetail'
import DailyWorkbench from './pages/DailyWorkbench'
import DailySummaries from './pages/DailySummaries'
import KnowledgeBase from './pages/KnowledgeBase'
import DateTimeDisplay from './components/DateTimeDisplay'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-foreground">
                  Project Workbench
                </h1>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex space-x-1">
                <NavLink to="/">
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      项目看板
                    </Button>
                  )}
                </NavLink>
                <NavLink to="/workbench">
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      今日工作台
                    </Button>
                  )}
                </NavLink>
                <NavLink to="/summaries">
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      往日任务
                    </Button>
                  )}
                </NavLink>
                <NavLink to="/knowledge">
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      工作知识库
                    </Button>
                  )}
                </NavLink>
              </div>
            </div>

            {/* DateTime Display */}
            <div className="flex items-center">
              <DateTimeDisplay />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<ProjectDashboard />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/workbench" element={<DailyWorkbench />} />
          <Route path="/summaries" element={<DailySummaries />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
        </Routes>
      </main>
    </div>
  )
}

export default App