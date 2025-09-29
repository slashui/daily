import { Routes, Route, NavLink } from 'react-router-dom'
import ProjectDashboard from './pages/ProjectDashboard'
import ProjectDetail from './pages/ProjectDetail'
import DailyWorkbench from './pages/DailyWorkbench'
import DailySummaries from './pages/DailySummaries'
import DateTimeDisplay from './components/DateTimeDisplay'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Project-Daily Workbench
                </h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  项目看板
                </NavLink>
                <NavLink
                  to="/workbench"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  今日工作台
                </NavLink>
                <NavLink
                  to="/summaries"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  往日任务
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<ProjectDashboard />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/workbench" element={<DailyWorkbench />} />
          <Route path="/summaries" element={<DailySummaries />} />
        </Routes>
      </main>
    </div>
  )
}

export default App