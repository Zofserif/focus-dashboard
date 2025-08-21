"use client"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { Plus, Check, X, Clock, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip"

interface Task {
  id: string
  text: string
  completed: boolean
  timeWorked: number // in seconds
}

interface FocusTasksProps {
  tasks: Task[]
  newTask: string
  selectedTaskId: string | null
  isRunning: boolean
  isBreak: boolean
  onNewTaskChange: (value: string) => void
  onAddTask: () => void
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onSelectTask: (taskId: string) => void
  onClearCompleted: () => void
  formatTimeWorked: (seconds: number, includeCurrentSession?: boolean, taskId?: string) => string
}

export function FocusTasksComponent({
  tasks,
  newTask,
  selectedTaskId,
  isRunning,
  isBreak,
  onNewTaskChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSelectTask,
  onClearCompleted,
  formatTimeWorked,
}: FocusTasksProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0
    return a.completed ? 1 : -1
  })

  const hasContent = tasks.length > 0
  const cardHeight = hasContent ? "h-full max-h-[calc(100vh-200px)]" : "h-auto"

  return (
    <TooltipProvider>
      <Card
        className={`transition-all duration-300 flex flex-col ${cardHeight} overflow-hidden ${
          isRunning && !isBreak && selectedTaskId ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
        }`}
      >
        <CardHeader className="pb-2 px-3 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Focus Tasks</CardTitle>
            {tasks.some((task) => task.completed) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onClearCompleted}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-600 hover:text-black hover:bg-gray-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear completed tasks</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 py-0 pb-2 flex-1 flex flex-col min-h-0">
          <div className="flex gap-2 mb-2 flex-shrink-0">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => onNewTaskChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onAddTask()}
              className="h-8 text-sm"
            />
            <Button onClick={onAddTask} size="sm" className="h-8 w-8 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className={`${hasContent ? "flex-1 overflow-y-auto min-h-0" : "flex-shrink-0"}`}>
            <div className="space-y-2">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                    task.completed
                      ? "bg-gray-50 opacity-60"
                      : selectedTaskId === task.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectTask(task.id)}
                >
                  <Button
                    size="sm"
                    variant={task.completed ? "default" : "outline"}
                    className={`h-5 w-5 p-0 ${task.completed ? "bg-green-500 hover:bg-green-600" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTask(task.id)
                    }}
                  >
                    {task.completed && <Check className="h-3 w-3" />}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${task.completed ? "line-through text-gray-500" : ""}`}>
                      {task.text}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeWorked(task.timeWorked, true, task.id)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {selectedTaskId === task.id && !task.completed && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {isRunning && !isBreak ? "Focusing" : "Selected"}
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTask(task.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No tasks yet. Add one above to get started!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
