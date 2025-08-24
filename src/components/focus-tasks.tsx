"use client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Plus, Check, X, Clock, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  timeWorked: number; // in seconds
}

interface FocusTasksProps {
  tasks: Task[];
  newTask: string;
  selectedTaskId: string | null;
  isRunning: boolean;
  isBreak: boolean;
  onNewTaskChange: (value: string) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onClearCompleted: () => void;
  formatTimeWorked: (
    seconds: number,
    includeCurrentSession?: boolean,
    taskId?: string,
  ) => string;
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
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const hasContent = tasks.length > 0;
  const cardHeight = hasContent ? "h-full max-h-[calc(100vh-200px)]" : "h-auto";

  return (
    <TooltipProvider>
      <Card
        className={`flex flex-col transition-all duration-300 ${cardHeight} overflow-hidden ${
          isRunning && !isBreak && selectedTaskId
            ? "bg-blue-50/50 ring-2 ring-blue-500"
            : ""
        }`}
      >
        <CardHeader className="flex-shrink-0 px-3 py-2 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Focus Tasks</CardTitle>
            {tasks.some((task) => task.completed) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onClearCompleted}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-black"
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
        <CardContent className="flex min-h-0 flex-1 flex-col px-3 py-0 pb-2">
          <div className="mb-2 flex flex-shrink-0 gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => onNewTaskChange(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onAddTask()}
              className="h-8 text-sm"
            />
            {newTask.trim().length > 0 && (
              <Button onClick={onAddTask} size="sm" className="h-8 w-8 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div
            className={`${hasContent ? "min-h-0 flex-1 overflow-y-auto" : "flex-shrink-0"}`}
          >
            <div className="space-y-2">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm transition-all ${
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
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                  >
                    {task.completed && <Check className="h-3 w-3" />}
                  </Button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium ${task.completed ? "text-gray-500 line-through" : ""}`}
                    >
                      {task.text}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTimeWorked(task.timeWorked, true, task.id)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {selectedTaskId === task.id && !task.completed && (
                      <Badge variant="outline" className="px-1 py-0 text-xs">
                        {isRunning && !isBreak ? "Focusing" : "Selected"}
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  No tasks yet. Add one above to get started!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
