import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// Set UTF-8 encoding for all responses
app.use('*', async (c, next) => {
  await next()
  c.header('Content-Type', 'application/json; charset=utf-8')
})

// Utility function to calculate days since last update
function calculateDaysSinceUpdate(lastUpdatedAt: Date): number {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastUpdatedAt.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// ===== PROJECTS API =====

// GET /api/projects - Get all projects with days_since_update
app.get('/api/projects', async (c) => {
  try {
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const projects = await prisma.project.findMany({
      where: {
        is_hidden: false
      },
      include: {
        todos: true,
        dailyLogs: true
      }
    })

    // Add days_since_update field
    const projectsWithDays = projects.map(project => ({
      ...project,
      days_since_update: calculateDaysSinceUpdate(project.last_updated_at)
    }))

    return c.json(projectsWithDays)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

// POST /api/projects - Create new project
app.post('/api/projects', async (c) => {
  try {
    const { name, description } = await c.req.json()

    if (!name || typeof name !== 'string') {
      return c.json({ error: 'Project name is required' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        status: 'active'
      },
      include: {
        todos: true,
        dailyLogs: true
      }
    })

    return c.json(project, 201)
  } catch (error) {
    console.error('Error creating project:', error)
    return c.json({ error: 'Failed to create project' }, 500)
  }
})

// GET /api/projects/:id - Get single project with todos and logs
app.get('/api/projects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        todos: {
          orderBy: { created_at: 'desc' }
        },
        dailyLogs: {
          orderBy: { log_date: 'desc' }
        }
      }
    })

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// PUT /api/projects/:id - Update project info
app.put('/api/projects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, description, requirements, status } = await c.req.json()

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(status && { status }),
        last_updated_at: new Date()
      },
      include: {
        todos: true,
        dailyLogs: true
      }
    })

    return c.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return c.json({ error: 'Failed to update project' }, 500)
  }
})

// DELETE /api/projects/:id - Hide project (soft delete)
app.delete('/api/projects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if project exists
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // Hide project instead of deleting
    await prisma.project.update({
      where: { id },
      data: {
        is_hidden: true,
        last_updated_at: new Date()
      }
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error hiding project:', error)
    return c.json({ error: 'Failed to hide project' }, 500)
  }
})

// ===== TODOS API =====

// POST /api/todos - Create new todo
app.post('/api/todos', async (c) => {
  try {
    const { project_id, content, due_date } = await c.req.json()

    if (!content || typeof content !== 'string') {
      return c.json({ error: 'Todo content is required' }, 400)
    }

    if (!project_id || typeof project_id !== 'string') {
      return c.json({ error: 'Project ID is required' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Use sequential operations since D1 doesn't support interactive transactions
    const todo = await prisma.todo.create({
      data: {
        content,
        project_id,
        due_date: due_date ? new Date(due_date) : null
      }
    })

    // Update project's last_updated_at
    await prisma.project.update({
      where: { id: project_id },
      data: { last_updated_at: new Date() }
    })

    const result = todo

    return c.json(result, 201)
  } catch (error) {
    console.error('Error creating todo:', error)
    return c.json({ error: 'Failed to create todo' }, 500)
  }
})

// PUT /api/todos/:id - Update todo status
app.put('/api/todos/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { is_completed } = await c.req.json()

    if (typeof is_completed !== 'boolean') {
      return c.json({ error: 'is_completed must be a boolean' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Use sequential operations since D1 doesn't support interactive transactions
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        is_completed,
        completed_at: is_completed ? new Date() : null
      }
    })

    // Update project's last_updated_at
    await prisma.project.update({
      where: { id: todo.project_id },
      data: { last_updated_at: new Date() }
    })

    const result = todo

    return c.json(result)
  } catch (error) {
    console.error('Error updating todo:', error)
    return c.json({ error: 'Failed to update todo' }, 500)
  }
})

// DELETE /api/todos/:id - Delete todo
app.delete('/api/todos/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // First get the todo to find project_id
    const todo = await prisma.todo.findUnique({ where: { id } })
    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404)
    }

    // Use sequential operations since D1 doesn't support interactive transactions
    await prisma.todo.delete({ where: { id } })

    // Update project's last_updated_at
    await prisma.project.update({
      where: { id: todo.project_id },
      data: { last_updated_at: new Date() }
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return c.json({ error: 'Failed to delete todo' }, 500)
  }
})

// ===== DAILY LOGS API =====

// POST /api/logs - Create daily log
app.post('/api/logs', async (c) => {
  try {
    const { project_id, content } = await c.req.json()

    if (!content || typeof content !== 'string') {
      return c.json({ error: 'Log content is required' }, 400)
    }

    if (!project_id || typeof project_id !== 'string') {
      return c.json({ error: 'Project ID is required' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Use sequential operations since D1 doesn't support interactive transactions
    const log = await prisma.dailyLog.create({
      data: {
        content,
        project_id,
        log_date: new Date()
      }
    })

    // Update project's last_updated_at
    await prisma.project.update({
      where: { id: project_id },
      data: { last_updated_at: new Date() }
    })

    const result = log

    return c.json(result, 201)
  } catch (error) {
    console.error('Error creating log:', error)
    return c.json({ error: 'Failed to create log' }, 500)
  }
})

// DELETE /api/logs/:id - Delete daily log
app.delete('/api/logs/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // First get the log to find project_id
    const log = await prisma.dailyLog.findUnique({ where: { id } })
    if (!log) {
      return c.json({ error: 'Log not found' }, 404)
    }

    // Use sequential operations since D1 doesn't support interactive transactions
    await prisma.dailyLog.delete({ where: { id } })

    // Update project's last_updated_at
    await prisma.project.update({
      where: { id: log.project_id },
      data: { last_updated_at: new Date() }
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting log:', error)
    return c.json({ error: 'Failed to delete log' }, 500)
  }
})

// ===== HISTORICAL WORKBENCH API =====

// POST /api/workbench/save - Save daily workbench snapshot
app.post('/api/workbench/save', async (c) => {
  try {
    const { todos_data } = await c.req.json()

    if (!todos_data || !Array.isArray(todos_data)) {
      return c.json({ error: 'todos_data must be an array' }, 400)
    }

    // Generate Beijing date (UTC+8)
    const now = new Date()
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
    const workbench_date = beijingTime.toISOString().split('T')[0] // YYYY-MM-DD format

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if record for today already exists
    const existing = await prisma.historicalWorkbench.findUnique({
      where: { workbench_date }
    })

    const snapshot_data = JSON.stringify(todos_data)

    if (existing) {
      // Update existing record
      const updated = await prisma.historicalWorkbench.update({
        where: { workbench_date },
        data: { snapshot_data }
      })
      return c.json({ id: updated.id, date: workbench_date, message: 'Workbench updated successfully' }, 200)
    } else {
      // Create new record
      const created = await prisma.historicalWorkbench.create({
        data: {
          workbench_date,
          snapshot_data
        }
      })
      return c.json({ id: created.id, date: workbench_date, message: 'Workbench saved successfully' }, 201)
    }
  } catch (error) {
    console.error('Error saving workbench:', error)
    return c.json({ error: 'Failed to save workbench' }, 500)
  }
})

// GET /api/workbench/get/:id - Get historical workbench by ID
app.get('/api/workbench/get/:id', async (c) => {
  try {
    const id = c.req.param('id')

    if (!id || typeof id !== 'string') {
      return c.json({ error: 'ID is required' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const workbench = await prisma.historicalWorkbench.findUnique({
      where: { id }
    })

    if (!workbench) {
      return c.json({ error: 'Historical workbench not found' }, 404)
    }

    // Parse the JSON data
    const todos_data = JSON.parse(workbench.snapshot_data)

    return c.json({
      id: workbench.id,
      date: workbench.workbench_date,
      todos: todos_data,
      created_at: workbench.created_at
    })
  } catch (error) {
    console.error('Error retrieving workbench:', error)
    return c.json({ error: 'Failed to retrieve workbench' }, 500)
  }
})

// POST /api/workbench/get - Get historical workbench by ID (alternative endpoint for POST requests)
app.post('/api/workbench/get', async (c) => {
  try {
    const { id } = await c.req.json()

    if (!id || typeof id !== 'string') {
      return c.json({ error: 'ID is required' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const workbench = await prisma.historicalWorkbench.findUnique({
      where: { id }
    })

    if (!workbench) {
      return c.json({ error: 'Historical workbench not found' }, 404)
    }

    // Parse the JSON data
    const todos_data = JSON.parse(workbench.snapshot_data)

    return c.json({
      id: workbench.id,
      date: workbench.workbench_date,
      todos: todos_data,
      created_at: workbench.created_at
    })
  } catch (error) {
    console.error('Error retrieving workbench:', error)
    return c.json({ error: 'Failed to retrieve workbench' }, 500)
  }
})

// ===== DAILY WORKBENCH API =====

// Utility function to get current Beijing date
function getCurrentBeijingDate(): string {
  const now = new Date()
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
  return beijingTime.toISOString().split('T')[0] // YYYY-MM-DD format
}

// Function to create daily summary
async function createDailySummary(date: string, prisma: any) {
  console.log(`Creating daily summary for ${date}`)

  try {
    // Get all todos from yesterday's workbench
    const workbenchEntries = await prisma.dailyWorkbench.findMany({
      where: { work_date: date },
      include: {
        todo: {
          include: {
            project: true
          }
        }
      }
    })

    const completedTodos = []
    const pendingTodos = []

    if (workbenchEntries.length === 0) {
      console.log(`No workbench entries found for ${date}, creating empty summary`)
    } else {
      // Separate completed and pending todos
      workbenchEntries.forEach(entry => {
        const todoData = {
          id: entry.todo.id,
          content: entry.todo.content,
          project_name: entry.todo.project.name,
          completed_at: entry.todo.completed_at
        }

        if (entry.todo.is_completed) {
          completedTodos.push(todoData)
        } else {
          pendingTodos.push(todoData)
        }
      })
    }


    // Check if summary already exists
    const existingSummary = await prisma.dailySummary.findUnique({
      where: { summary_date: date }
    })

    const summaryData = {
      summary_date: date,
      completed_todos: JSON.stringify(completedTodos),
      pending_todos: JSON.stringify(pendingTodos),
      total_count: workbenchEntries.length,
      completed_count: completedTodos.length
    }

    if (existingSummary) {
      await prisma.dailySummary.update({
        where: { summary_date: date },
        data: summaryData
      })
      console.log(`Updated daily summary for ${date}`)
    } else {
      await prisma.dailySummary.create({
        data: summaryData
      })
      console.log(`Created daily summary for ${date}`)
    }

  } catch (error) {
    console.error(`Error creating daily summary for ${date}:`, error)
    throw error
  }
}

// GET /api/daily-workbench - Get today's workbench todos
app.get('/api/daily-workbench', async (c) => {
  try {
    const work_date = getCurrentBeijingDate()
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const workbenchEntries = await prisma.dailyWorkbench.findMany({
      where: { work_date },
      include: {
        todo: {
          include: {
            project: true
          }
        }
      },
      orderBy: { added_at: 'desc' }
    })

    // Transform to match the expected format
    const todayTodos = workbenchEntries.map(entry => ({
      ...entry.todo,
      project: entry.todo.project
    }))

    return c.json(todayTodos)
  } catch (error) {
    console.error('Error fetching daily workbench:', error)
    return c.json({ error: 'Failed to fetch daily workbench' }, 500)
  }
})

// POST /api/daily-workbench/add - Add todo to today's workbench
app.post('/api/daily-workbench/add', async (c) => {
  try {
    const { todo_id } = await c.req.json()

    if (!todo_id || typeof todo_id !== 'string') {
      return c.json({ error: 'todo_id is required' }, 400)
    }

    const work_date = getCurrentBeijingDate()
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if todo exists
    const todo = await prisma.todo.findUnique({
      where: { id: todo_id },
      include: { project: true }
    })

    if (!todo) {
      return c.json({ error: 'Todo not found' }, 404)
    }

    // Check if already in today's workbench
    const existing = await prisma.dailyWorkbench.findUnique({
      where: {
        todo_id_work_date: {
          todo_id,
          work_date
        }
      }
    })

    if (existing) {
      return c.json({ error: 'Todo already in today\'s workbench' }, 409)
    }

    // Add to daily workbench
    await prisma.dailyWorkbench.create({
      data: {
        todo_id,
        work_date
      }
    })

    return c.json({ message: 'Todo added to today\'s workbench', todo: { ...todo, project: todo.project } }, 201)
  } catch (error) {
    console.error('Error adding to daily workbench:', error)
    return c.json({ error: 'Failed to add to daily workbench' }, 500)
  }
})

// DELETE /api/daily-workbench/remove - Remove todo from today's workbench
app.delete('/api/daily-workbench/remove', async (c) => {
  try {
    const { todo_id } = await c.req.json()

    if (!todo_id || typeof todo_id !== 'string') {
      return c.json({ error: 'todo_id is required' }, 400)
    }

    const work_date = getCurrentBeijingDate()
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if exists in today's workbench
    const existing = await prisma.dailyWorkbench.findUnique({
      where: {
        todo_id_work_date: {
          todo_id,
          work_date
        }
      }
    })

    if (!existing) {
      return c.json({ error: 'Todo not found in today\'s workbench' }, 404)
    }

    // Remove from daily workbench
    await prisma.dailyWorkbench.delete({
      where: { id: existing.id }
    })

    return c.json({ message: 'Todo removed from today\'s workbench' })
  } catch (error) {
    console.error('Error removing from daily workbench:', error)
    return c.json({ error: 'Failed to remove from daily workbench' }, 500)
  }
})

// GET /api/daily-workbench/history/:date - Get workbench for a specific date
app.get('/api/daily-workbench/history/:date', async (c) => {
  try {
    const work_date = c.req.param('date')

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(work_date)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const workbenchEntries = await prisma.dailyWorkbench.findMany({
      where: { work_date },
      include: {
        todo: {
          include: {
            project: true
          }
        }
      },
      orderBy: { added_at: 'desc' }
    })

    // Transform to match the expected format
    const dayTodos = workbenchEntries.map(entry => ({
      ...entry.todo,
      project: entry.todo.project
    }))

    return c.json({ date: work_date, todos: dayTodos })
  } catch (error) {
    console.error('Error fetching workbench history:', error)
    return c.json({ error: 'Failed to fetch workbench history' }, 500)
  }
})

// ===== DAILY SUMMARY API =====

// GET /api/daily-summaries - Get all daily summaries
app.get('/api/daily-summaries', async (c) => {
  try {
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const summaries = await prisma.dailySummary.findMany({
      orderBy: { summary_date: 'desc' }
    })

    // Parse JSON strings back to objects
    const formattedSummaries = summaries.map(summary => ({
      ...summary,
      completed_todos: JSON.parse(summary.completed_todos),
      pending_todos: JSON.parse(summary.pending_todos)
    }))

    return c.json(formattedSummaries)
  } catch (error) {
    console.error('Error fetching daily summaries:', error)
    return c.json({ error: 'Failed to fetch daily summaries' }, 500)
  }
})

// GET /api/daily-summaries/:date - Get daily summary by date
app.get('/api/daily-summaries/:date', async (c) => {
  try {
    const date = c.req.param('date')
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400)
    }

    const summary = await prisma.dailySummary.findUnique({
      where: { summary_date: date }
    })

    if (!summary) {
      return c.json({ error: 'Daily summary not found' }, 404)
    }

    // Parse JSON strings back to objects
    const formattedSummary = {
      ...summary,
      completed_todos: JSON.parse(summary.completed_todos),
      pending_todos: JSON.parse(summary.pending_todos)
    }

    return c.json(formattedSummary)
  } catch (error) {
    console.error('Error fetching daily summary:', error)
    return c.json({ error: 'Failed to fetch daily summary' }, 500)
  }
})

// POST /api/daily-summaries/generate - Manually trigger daily summary generation
app.post('/api/daily-summaries/generate', async (c) => {
  try {
    const { date } = await c.req.json()
    const targetDate = date || getCurrentBeijingDate()

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    await createDailySummary(targetDate, prisma)

    return c.json({
      message: 'Daily summary generated successfully',
      date: targetDate
    })
  } catch (error) {
    console.error('Error generating daily summary:', error)
    return c.json({ error: 'Failed to generate daily summary' }, 500)
  }
})

// PUT /api/daily-summaries/:date/manual - Update manual summary for a specific date
app.put('/api/daily-summaries/:date/manual', async (c) => {
  try {
    const date = c.req.param('date')
    const { manual_summary } = await c.req.json()

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if summary exists, if not create it
    const existing = await prisma.dailySummary.findUnique({
      where: { summary_date: date }
    })

    let summary
    if (existing) {
      // Update existing summary
      summary = await prisma.dailySummary.update({
        where: { summary_date: date },
        data: { manual_summary: manual_summary || null }
      })
    } else {
      // Create new summary with empty task data
      summary = await prisma.dailySummary.create({
        data: {
          summary_date: date,
          completed_todos: JSON.stringify([]),
          pending_todos: JSON.stringify([]),
          total_count: 0,
          completed_count: 0,
          manual_summary: manual_summary || null
        }
      })
    }

    // Parse JSON strings back to objects
    const formattedSummary = {
      ...summary,
      completed_todos: JSON.parse(summary.completed_todos),
      pending_todos: JSON.parse(summary.pending_todos)
    }

    return c.json(formattedSummary)
  } catch (error) {
    console.error('Error updating manual summary:', error)
    return c.json({ error: 'Failed to update manual summary' }, 500)
  }
})

// ===== KNOWLEDGE BASE API =====

// GET /api/knowledge - Get all knowledge entries
app.get('/api/knowledge', async (c) => {
  try {
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const knowledge = await prisma.knowledgeBase.findMany({
      orderBy: { created_at: 'desc' }
    })

    return c.json(knowledge)
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return c.json({ error: 'Failed to fetch knowledge' }, 500)
  }
})

// POST /api/knowledge - Create new knowledge entry
app.post('/api/knowledge', async (c) => {
  try {
    const { title, content } = await c.req.json()

    if (!title || typeof title !== 'string') {
      return c.json({ error: 'Title is required' }, 400)
    }

    if (!content || typeof content !== 'string') {
      return c.json({ error: 'Content is required' }, 400)
    }

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title: title.trim(),
        content: content.trim()
      }
    })

    return c.json(knowledge, 201)
  } catch (error) {
    console.error('Error creating knowledge:', error)
    return c.json({ error: 'Failed to create knowledge' }, 500)
  }
})

// PUT /api/knowledge/:id - Update knowledge entry
app.put('/api/knowledge/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { title, content } = await c.req.json()

    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if knowledge exists
    const existing = await prisma.knowledgeBase.findUnique({ where: { id } })
    if (!existing) {
      return c.json({ error: 'Knowledge entry not found' }, 404)
    }

    const knowledge = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        updated_at: new Date()
      }
    })

    return c.json(knowledge)
  } catch (error) {
    console.error('Error updating knowledge:', error)
    return c.json({ error: 'Failed to update knowledge' }, 500)
  }
})

// DELETE /api/knowledge/:id - Delete knowledge entry
app.delete('/api/knowledge/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const adapter = new PrismaD1(c.env.DB)
    const prisma = new PrismaClient({ adapter })

    // Check if knowledge exists
    const existing = await prisma.knowledgeBase.findUnique({ where: { id } })
    if (!existing) {
      return c.json({ error: 'Knowledge entry not found' }, 404)
    }

    await prisma.knowledgeBase.delete({ where: { id } })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting knowledge:', error)
    return c.json({ error: 'Failed to delete knowledge' }, 500)
  }
})

// Scheduled function (Cron trigger)
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext): Promise<void> {
    console.log('Scheduled task triggered at:', new Date().toISOString())

    try {
      const adapter = new PrismaD1(env.DB)
      const prisma = new PrismaClient({ adapter })

      // Get yesterday's date in Beijing time
      const now = new Date()
      const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
      const yesterday = new Date(beijingTime)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // Generate summary for yesterday
      await createDailySummary(yesterdayStr, prisma)
      console.log(`Daily summary created for ${yesterdayStr}`)

      // Create today's blank summary for manual input
      const todayStr = beijingTime.toISOString().split('T')[0]
      const existingToday = await prisma.dailySummary.findUnique({
        where: { summary_date: todayStr }
      })

      if (!existingToday) {
        await prisma.dailySummary.create({
          data: {
            summary_date: todayStr,
            completed_todos: JSON.stringify([]),
            pending_todos: JSON.stringify([]),
            total_count: 0,
            completed_count: 0,
            manual_summary: null
          }
        })
        console.log(`Blank summary created for today: ${todayStr}`)
      } else {
        console.log(`Summary for today (${todayStr}) already exists`)
      }

    } catch (error) {
      console.error('Error in scheduled task:', error)
    }
  }
}