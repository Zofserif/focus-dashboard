"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Clock, ChevronDown, X, Minimize2, Maximize2, Play, Pause, Square } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "~/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { Progress } from "~/components/ui/progress"

import { TimerSection } from "./timer-section"
import { FocusTasksComponent } from "./focus-tasks"
import { BrainDumpComponent } from "./brain-dump"

interface Task {
  id: string
  text: string
  completed: boolean
  timeWorked: number // in seconds
}

interface FocusSession {
  id: string
  date: string
  focusTime: number
  breakTime: number
  completedCycles: number
}

export function FocusModule() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [originalSessionTime, setOriginalSessionTime] = useState(25 * 60)

  const [focusTime, setFocusTime] = useState(25)
  const [shortBreak, setShortBreak] = useState(5)
  const [longBreak, setLongBreak] = useState(15)
  const [cyclesUntilLongBreak, setCyclesUntilLongBreak] = useState(4)
  const [enableBreaks, setEnableBreaks] = useState(true)

  const [hasCustomTimer, setHasCustomTimer] = useState(false)
  const [customFocusTime, setCustomFocusTime] = useState(25 * 60) // Store custom time in seconds
  const [initialCycle1Timer, setInitialCycle1Timer] = useState<number | null>(null) // Store initial cycle 1 value in seconds
  const [cycle1FocusTime, setCycle1FocusTime] = useState<number | null>(null)

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [currentSessionTime, setCurrentSessionTime] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)

  const [showFocusPopup, setShowFocusPopup] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isEditingTimer, setIsEditingTimer] = useState(false)
  const [editTimeValue, setEditTimeValue] = useState("")

  const [notepadContent, setNotepadContent] = useState("")
  const [currentTime, setCurrentTime] = useState("")

  const deviceTimezone = (() => {
    const offset = -new Date().getTimezoneOffset() / 60
    return `Etc/GMT${offset <= 0 ? "+" : "-"}${Math.abs(offset)}`
  })()

  const [selectedTimezone, setSelectedTimezone] = useState(deviceTimezone)

  const audioRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const timezones = [
    { label: "UTC-12 (IDLW)", value: "Etc/GMT+12" },
    { label: "UTC-11 (SST)", value: "Etc/GMT+11" },
    { label: "UTC-10 (HST)", value: "Etc/GMT+10" },
    { label: "UTC-9 (AKST)", value: "Etc/GMT+9" },
    { label: "UTC-8 (PST)", value: "Etc/GMT+8" },
    { label: "UTC-7 (MST)", value: "Etc/GMT+7" },
    { label: "UTC-6 (CST)", value: "Etc/GMT+6" },
    { label: "UTC-5 (EST)", value: "Etc/GMT+5" },
    { label: "UTC-4 (AST)", value: "Etc/GMT+4" },
    { label: "UTC-3 (ART)", value: "Etc/GMT+3" },
    { label: "UTC-2 (GST)", value: "Etc/GMT+2" },
    { label: "UTC-1 (CVT)", value: "Etc/GMT+1" },
    { label: "UTC+0 (UTC)", value: "UTC" },
    { label: "UTC+1 (CET)", value: "Etc/GMT-1" },
    { label: "UTC+2 (EET)", value: "Etc/GMT-2" },
    { label: "UTC+3 (MSK)", value: "Etc/GMT-3" },
    { label: "UTC+4 (GST)", value: "Etc/GMT-4" },
    { label: "UTC+5 (PKT)", value: "Etc/GMT-5" },
    { label: "UTC+6 (BST)", value: "Etc/GMT-6" },
    { label: "UTC+7 (ICT)", value: "Etc/GMT-7" },
    { label: "UTC+8 (CST)", value: "Etc/GMT-8" },
    { label: "UTC+9 (JST)", value: "Etc/GMT-9" },
    { label: "UTC+10 (AEST)", value: "Etc/GMT-10" },
    { label: "UTC+11 (SBT)", value: "Etc/GMT-11" },
    { label: "UTC+12 (NZST)", value: "Etc/GMT-12" },
  ]

  const getFocusTimeMinutes = () => Math.round(timeLeft / 60)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: selectedTimezone,
      })
      setCurrentTime(timeString)
    }

    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    return () => clearInterval(timeInterval)
  }, [selectedTimezone])

  useEffect(() => {
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }

    audioRef.current = { play: createBeepSound }
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })

        setCurrentSessionTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true")

      if (event.code === "Space" && !isEditingTimer && !isTyping) {
        event.preventDefault()
        if (selectedTaskId && !isBreak) {
          if (isRunning) {
            pauseTimer()
          } else {
            startTimer() // This will automatically show the popup for selected tasks
          }
        } else {
          if (isRunning) {
            pauseTimer()
          } else {
            startTimer()
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRunning, isEditingTimer, selectedTaskId, isBreak])

  const handleSessionComplete = () => {
    setIsRunning(false)

    if (audioRef.current) {
      audioRef.current.play()
    }

    if (!isBreak) {
      const newCompletedCycles = completedCycles + 1
      setCompletedCycles(newCompletedCycles)

      if (newCompletedCycles === 1) {
        // For the first cycle completion, save the timer value that was actually used
        const actualCycle1Time = originalSessionTime
        setCycle1FocusTime(actualCycle1Time)
        setInitialCycle1Timer(actualCycle1Time)
      }

      if (selectedTaskId) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === selectedTaskId ? { ...task, timeWorked: task.timeWorked + currentSessionTime } : task,
          ),
        )
      }

      const newSession: FocusSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        focusTime: currentSessionTime,
        breakTime: 0,
        completedCycles: newCompletedCycles,
      }
      setSessions((prev) => [newSession, ...prev])

      if (enableBreaks) {
        const isLongBreakTime = newCompletedCycles % cyclesUntilLongBreak === 0
        const breakTime = (isLongBreakTime ? longBreak : shortBreak) * 60
        setIsBreak(true)
        setTimeLeft(breakTime)
        setOriginalSessionTime(breakTime)
        setCurrentSessionTime(0)
        setShowFocusPopup(false)
        setTimeout(() => {
          setIsRunning(true)
          setSessionStartTime(Date.now())
        }, 500)
      } else {
        const nextFocusTime = initialCycle1Timer || originalSessionTime
        setTimeLeft(nextFocusTime)
        setOriginalSessionTime(nextFocusTime)
        setCurrentSessionTime(0)
        // Auto-start the next cycle
        setTimeout(() => {
          setIsRunning(true)
          setSessionStartTime(Date.now())
          if (selectedTaskId) {
            setShowFocusPopup(true)
            setIsMinimized(false)
          }
        }, 500)
      }
    } else {
      setIsBreak(false)
      const nextFocusTime = initialCycle1Timer || originalSessionTime
      setTimeLeft(nextFocusTime)
      setOriginalSessionTime(nextFocusTime)
      setCurrentSessionTime(0)
      // Auto-start the focus session after break
      setTimeout(() => {
        setIsRunning(true)
        setSessionStartTime(Date.now())
        if (selectedTaskId) {
          setShowFocusPopup(true)
          setIsMinimized(false)
        }
      }, 500)
    }

    setShowFocusPopup(false)
  }

  const startTimer = () => {
    setIsRunning(true)
    setSessionStartTime(Date.now())

    if (completedCycles === 0 && !initialCycle1Timer) {
      setInitialCycle1Timer(originalSessionTime)
      setCycle1FocusTime(originalSessionTime)
    }

    if (selectedTaskId && !isBreak) {
      setShowFocusPopup(true)
      setIsMinimized(false)
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
    if (!isBreak) {
      setShowFocusPopup(false)
    }
  }

  const stopTimer = () => {
    setIsRunning(false)

    if (selectedTaskId && currentSessionTime > 0 && !isBreak) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTaskId ? { ...task, timeWorked: task.timeWorked + currentSessionTime } : task,
        ),
      )
    }

    const resetTime = isBreak ? (completedCycles % cyclesUntilLongBreak === 0 ? longBreak : shortBreak) * 60 : 25 * 60

    setTimeLeft(resetTime)
    setOriginalSessionTime(resetTime)
    setCurrentSessionTime(0)
    setSessionStartTime(null)
    setShowFocusPopup(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setIsBreak(false)
    const resetTime = initialCycle1Timer || originalSessionTime
    setTimeLeft(resetTime)
    setOriginalSessionTime(resetTime)
    setCompletedCycles(0)
    setCurrentSessionTime(0)
    setSessionStartTime(null)
    setShowFocusPopup(false)
  }

  const startEditingTimer = () => {
    if (!isRunning) {
      setIsEditingTimer(true)
      setEditTimeValue("")
    }
  }

  const saveTimerEdit = () => {
    const newMinutes = Number.parseInt(editTimeValue)
    if (newMinutes > 0 && newMinutes <= 120) {
      const newTime = newMinutes * 60
      setTimeLeft(newTime)
      setOriginalSessionTime(newTime)
      setCurrentSessionTime(0)
      setHasCustomTimer(true)
      setCustomFocusTime(newTime)
      setInitialCycle1Timer(newTime)
      setCycle1FocusTime(newTime)
    }
    setIsEditingTimer(false)
  }

  const cancelTimerEdit = () => {
    setIsEditingTimer(false)
    setEditTimeValue("")
  }

  const handleTimerEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      saveTimerEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelTimerEdit()
    }
  }

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false,
        timeWorked: 0,
      }
      setTasks((prev) => [task, ...prev])
      setNewTask("")
    }
  }

  const toggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task && !task.completed) {
      const celebrationAudio = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = celebrationAudio.createOscillator()
      const gainNode = celebrationAudio.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(celebrationAudio.destination)

      oscillator.frequency.setValueAtTime(523, celebrationAudio.currentTime)
      oscillator.frequency.setValueAtTime(659, celebrationAudio.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(784, celebrationAudio.currentTime + 0.2)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, celebrationAudio.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, celebrationAudio.currentTime + 0.4)

      oscillator.start(celebrationAudio.currentTime)
      oscillator.stop(celebrationAudio.currentTime + 0.4)

      const emojiElement = document.createElement("div")
      emojiElement.textContent = "🎉"
      emojiElement.style.position = "fixed"
      emojiElement.style.fontSize = "2rem"
      emojiElement.style.zIndex = "9999"
      emojiElement.style.pointerEvents = "none"
      emojiElement.style.left = "50%"
      emojiElement.style.top = "50%"
      emojiElement.style.transform = "translate(-50%, -50%)"
      emojiElement.style.animation = "bounce 0.6s ease-out"

      document.body.appendChild(emojiElement)
      setTimeout(() => document.body.removeChild(emojiElement), 600)
    }

    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)))

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null)
    }
  }

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null)
    }
  }

  const clearCompletedTasks = () => {
    setTasks((prev) => prev.filter((task) => !task.completed))
  }

  const clearNotepad = () => {
    setNotepadContent("")
  }

  const selectTask = (taskId: string) => {
    if (tasks.find((t) => t.id === taskId)?.completed) return
    setSelectedTaskId(selectedTaskId === taskId ? null : taskId)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatTimeWorked = (seconds: number, includeCurrentSession = false, taskId?: string) => {
    let totalSeconds = seconds

    if (includeCurrentSession && taskId === selectedTaskId && currentSessionTime > 0 && !isBreak) {
      totalSeconds += currentSessionTime
    }

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remainingSeconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const getProgress = () => {
    if (originalSessionTime === 0) return 0
    if (timeLeft === 0 && !isRunning) return 0
    const progress = ((originalSessionTime - timeLeft) / originalSessionTime) * 100
    return Math.max(0, Math.min(100, progress))
  }

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null

  return (
    <TooltipProvider>
      <div className="w-full mx-auto p-1 h-screen flex flex-col">
        <Card className="w-full h-full overflow-hidden">
          <CardHeader className="pb-2 px-4 py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                Focus Timer
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-base font-mono font-semibold text-muted-foreground">{currentTime}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-1 text-muted-foreground hover:text-foreground">
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {timezones.map((timezone) => (
                      <DropdownMenuItem
                        key={timezone.value}
                        onClick={() => setSelectedTimezone(timezone.value)}
                        className={selectedTimezone === timezone.value ? "bg-blue-50 text-blue-700" : ""}
                      >
                        {timezone.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedTimezone !== deviceTimezone && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setSelectedTimezone(deviceTimezone)}
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset to local time</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-2 px-4 flex-1 flex flex-col">
            <Tabs defaultValue="timer" className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="timer">Timer</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="timer" className="space-y-3 flex-1 flex flex-col">
                <TimerSection
                  timeLeft={timeLeft}
                  isRunning={isRunning}
                  isBreak={isBreak}
                  completedCycles={completedCycles}
                  isEditingTimer={isEditingTimer}
                  editTimeValue={editTimeValue}
                  enableBreaks={enableBreaks}
                  shortBreak={shortBreak}
                  longBreak={longBreak}
                  cyclesUntilLongBreak={cyclesUntilLongBreak}
                  onStart={startTimer}
                  onPause={pauseTimer}
                  onStop={stopTimer}
                  onReset={resetTimer}
                  onStartEdit={startEditingTimer}
                  onSaveEdit={saveTimerEdit}
                  onCancelEdit={cancelTimerEdit}
                  onEditValueChange={setEditTimeValue}
                  onEditKeyDown={handleTimerEditKeyDown}
                  onEnableBreaksChange={setEnableBreaks}
                  onShortBreakChange={setShortBreak}
                  onLongBreakChange={setLongBreak}
                  onCyclesUntilLongBreakChange={setCyclesUntilLongBreak}
                  getProgress={getProgress}
                  formatTime={formatTime}
                />

                <div className="grid grid-cols-2 gap-3 flex-1">
                  <FocusTasksComponent
                    tasks={tasks}
                    newTask={newTask}
                    selectedTaskId={selectedTaskId}
                    isRunning={isRunning}
                    isBreak={isBreak}
                    onNewTaskChange={setNewTask}
                    onAddTask={addTask}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    onSelectTask={selectTask}
                    onClearCompleted={clearCompletedTasks}
                    formatTimeWorked={formatTimeWorked}
                  />

                  <BrainDumpComponent
                    notepadContent={notepadContent}
                    onContentChange={setNotepadContent}
                    onClear={clearNotepad}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-3 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No focus sessions yet. Complete a focus session to see your history!
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="pt-3 pb-3 px-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{new Date(session.date).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.date).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                {Math.floor(session.focusTime / 60)}m {session.focusTime % 60}s
                              </div>
                              <div className="text-xs text-muted-foreground">{session.completedCycles} cycles</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {showFocusPopup && selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className={`w-full max-w-md mx-4 ${isMinimized ? "h-20" : ""} transition-all duration-300`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Focus Mode</CardTitle>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setIsMinimized(!isMinimized)}>
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowFocusPopup(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold mb-2">{formatTime(timeLeft)}</div>
                    <Progress value={getProgress()} className="w-full h-2 mb-4" />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900 mb-1">Current Focus Task:</div>
                    <div className="text-blue-800">{selectedTask.text}</div>
                    <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Total time worked: {formatTimeWorked(selectedTask.timeWorked, true, selectedTask.id)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isRunning ? (
                      <Button onClick={pauseTimer} className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={startTimer} className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}

                    <Button onClick={stopTimer} variant="outline" className="flex-1 bg-transparent">
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        <style jsx>{`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate(-50%, -50%) scale(1);
            }
            40%, 43% {
              transform: translate(-50%, -50%) scale(1.3);
            }
            70% {
              transform: translate(-50%, -50%) scale(1.1);
            }
            90% {
              transform: translate(-50%, -50%) scale(1.05);
            }
          }
        `}</style>
      </div>
    </TooltipProvider>
  )
}
