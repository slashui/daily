import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkbenchState {
  todayTodoIds: string[]
  todayDate: string // Track which date the todos belong to
  addTodoToToday: (todoId: string) => void
  removeTodoFromToday: (todoId: string) => void
  clearTodayTodos: () => void
  isTodoInToday: (todoId: string) => boolean
  checkAndClearIfNewDay: () => void
}

// Get current Beijing date in YYYY-MM-DD format
const getCurrentBeijingDate = (): string => {
  const now = new Date()
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
  return beijingTime.toISOString().split('T')[0]
}

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set, get) => ({
      todayTodoIds: [],
      todayDate: getCurrentBeijingDate(),

      addTodoToToday: (todoId: string) => {
        get().checkAndClearIfNewDay()
        set((state) => {
          if (!state.todayTodoIds.includes(todoId)) {
            return {
              todayTodoIds: [...state.todayTodoIds, todoId],
              todayDate: getCurrentBeijingDate()
            }
          }
          return state
        })
      },

      removeTodoFromToday: (todoId: string) => {
        get().checkAndClearIfNewDay()
        set((state) => ({
          todayTodoIds: state.todayTodoIds.filter(id => id !== todoId),
          todayDate: getCurrentBeijingDate()
        }))
      },

      clearTodayTodos: () => {
        set({
          todayTodoIds: [],
          todayDate: getCurrentBeijingDate()
        })
      },

      isTodoInToday: (todoId: string) => {
        get().checkAndClearIfNewDay()
        return get().todayTodoIds.includes(todoId)
      },

      checkAndClearIfNewDay: () => {
        const currentDate = getCurrentBeijingDate()
        const storedDate = get().todayDate

        if (currentDate !== storedDate) {
          // It's a new day, clear the todos
          set({
            todayTodoIds: [],
            todayDate: currentDate
          })
        }
      }
    }),
    {
      name: 'workbench-storage',
      // Only persist the todos and date, not the functions
      partialize: (state) => ({
        todayTodoIds: state.todayTodoIds,
        todayDate: state.todayDate
      }),
    }
  )
)