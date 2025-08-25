"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Clock,
  ChevronDown,
  X,
  Minimize2,
  Maximize2,
  Play,
  Pause,
  Square,
  Coffee,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Progress } from "~/components/ui/progress";

import { TimerSection } from "./timer-section";
import { FocusTasksComponent } from "./focus-tasks";
import { BrainDumpComponent } from "./brain-dump";
import { set } from "zod";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  timeWorked: number; // in seconds
}

interface FocusSession {
  id: string;
  date: string;
  focusTime: number;
  breakTime: number;
  completedCycles: number;
  taskName?: string;
  taskId?: string;
}

interface WindowWithAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function FocusModule() {
  // Initialize all states with default values first
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [originalSessionTime, setOriginalSessionTime] = useState(25 * 60);
  const [focusTime, setFocusTime] = useState(25);
  const [initialFocusTime, setInitialFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [enableBreaks, setEnableBreaks] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionTaskId, setSessionTaskId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [showFocusPopup, setShowFocusPopup] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState("");
  const [notepadContent, setNotepadContent] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  const deviceTimezone = (() => {
    const offset = -new Date().getTimezoneOffset() / 60;
    return `Etc/GMT${offset <= 0 ? "+" : "-"}${Math.abs(offset)}`;
  })();

  const [selectedTimezone, setSelectedTimezone] = useState(deviceTimezone);

  const audioRef = useRef<{ play: () => void } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
  ];

  // Load saved state after component mounts (client-side)
  useEffect(() => {
    // Load timer state
    const savedTimeLeft = localStorage.getItem("focusTimer_timeLeft");
    if (savedTimeLeft) setTimeLeft(Number.parseInt(savedTimeLeft, 10));

    const savedIsRunning = localStorage.getItem("focusTimer_isRunning");
    if (savedIsRunning) setIsRunning(savedIsRunning === "true");

    const savedIsBreak = localStorage.getItem("focusTimer_isBreak");
    if (savedIsBreak) setIsBreak(savedIsBreak === "true");

    const savedCompletedCycles = localStorage.getItem(
      "focusTimer_completedCycles",
    );
    if (savedCompletedCycles)
      setCompletedCycles(Number.parseInt(savedCompletedCycles, 10));

    const savedOriginalSessionTime = localStorage.getItem(
      "focusTimer_originalSessionTime",
    );
    if (savedOriginalSessionTime)
      setOriginalSessionTime(Number.parseInt(savedOriginalSessionTime, 10));

    // Load settings
    const savedFocusTime = localStorage.getItem("focusTimer_focusTime");
    if (savedFocusTime) setFocusTime(Number.parseInt(savedFocusTime, 10));

    const savedInitialFocusTime = localStorage.getItem(
      "focusTimer_initialFocusTime",
    );
    if (savedInitialFocusTime)
      setInitialFocusTime(Number.parseInt(savedInitialFocusTime, 10));

    const savedShortBreak = localStorage.getItem("focusTimer_shortBreak");
    if (savedShortBreak) setShortBreak(Number.parseInt(savedShortBreak, 10));

    const savedEnableBreaks = localStorage.getItem("focusTimer_enableBreaks");
    if (savedEnableBreaks) setEnableBreaks(savedEnableBreaks === "true");

    // Load tasks and selected task
    const savedTasks = localStorage.getItem("focusTimer_tasks");
    if (savedTasks) setTasks(JSON.parse(savedTasks) as Task[]);

    const savedSelectedTaskId = localStorage.getItem("focusTimer_selectedTask");
    if (savedSelectedTaskId) setSelectedTaskId(savedSelectedTaskId);

    const savedSessionTaskId = localStorage.getItem("focusTimer_sessionTaskId");
    if (savedSessionTaskId) setSessionTaskId(savedSessionTaskId);

    // Load sessions
    const savedSessions = localStorage.getItem("focusTimer_sessions");
    if (savedSessions) setSessions(JSON.parse(savedSessions) as FocusSession[]);

    // Load notepad
    const savedNotepadContent = localStorage.getItem("focusTimer_notes");
    if (savedNotepadContent) setNotepadContent(savedNotepadContent);

    // Load timezone
    const savedSelectedTimezone = localStorage.getItem(
      "focusTimer_selectedTimezone",
    );
    if (savedSelectedTimezone) setSelectedTimezone(savedSelectedTimezone);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    localStorage.setItem("focusTimer_timeLeft", timeLeft.toString());
    localStorage.setItem("focusTimer_isRunning", isRunning.toString());
    localStorage.setItem("focusTimer_isBreak", isBreak.toString());
    localStorage.setItem(
      "focusTimer_completedCycles",
      completedCycles.toString(),
    );
    localStorage.setItem(
      "focusTimer_originalSessionTime",
      originalSessionTime.toString(),
    );
  }, [timeLeft, isRunning, isBreak, completedCycles, originalSessionTime]);

  useEffect(() => {
    localStorage.setItem("focusTimer_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("focusTimer_notes", notepadContent);
  }, [notepadContent]);

  useEffect(() => {
    localStorage.setItem("focusTimer_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    const settings = {
      focusTime,
      initialFocusTime,
      shortBreak,
      enableBreaks,
      selectedTimezone,
    };
    localStorage.setItem("focusTimer_settings", JSON.stringify(settings));
  }, [focusTime, initialFocusTime, shortBreak, enableBreaks, selectedTimezone]);

  useEffect(() => {
    if (selectedTaskId) {
      localStorage.setItem("focusTimer_selectedTask", selectedTaskId);
    } else {
      localStorage.removeItem("focusTimer_selectedTask");
    }
  }, [selectedTaskId]);

  // Define stopTimer first
  const stopTimer = useCallback(() => {
    setIsRunning(false);

    if (sessionTaskId && currentSessionTime > 0 && !isBreak) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === sessionTaskId
            ? { ...task, timeWorked: task.timeWorked + currentSessionTime }
            : task,
        ),
      );
    }

    if (isBreak) {
      const breakTime =
        enableBreaks && shortBreak > 0 ? shortBreak * 60 : focusTime * 60;
      setTimeLeft(breakTime);
      setOriginalSessionTime(breakTime);
      if (!enableBreaks || shortBreak === 0) {
        setIsBreak(false);
      }
    } else {
      const focusTimeSeconds =
        (completedCycles > 0 ? initialFocusTime : focusTime) * 60;
      setTimeLeft(focusTimeSeconds);
      setOriginalSessionTime(focusTimeSeconds);
    }

    setCurrentSessionTime(0);
    setShowFocusPopup(false);
    setSessionTaskId(null);
  }, [
    sessionTaskId,
    currentSessionTime,
    isBreak,
    enableBreaks,
    shortBreak,
    focusTime,
    completedCycles,
    initialFocusTime,
  ]);

  // Now define handleSessionComplete
  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);

    if (audioRef.current) {
      audioRef.current.play();
    }

    if (!isBreak) {
      const newCompletedCycles = completedCycles + 1;
      setCompletedCycles(newCompletedCycles);

      if (newCompletedCycles === 1) {
        setInitialFocusTime(focusTime);
      }

      if (sessionTaskId) {
        const focusTimeDuration =
          initialFocusTime > 0 ? initialFocusTime * 60 : focusTime * 60;
        setTasks((prev) =>
          prev.map((task) =>
            task.id === sessionTaskId
              ? { ...task, timeWorked: task.timeWorked + focusTimeDuration }
              : task,
          ),
        );
      }

      const selectedTaskForHistory = sessionTaskId
        ? tasks.find((t) => t.id === sessionTaskId)
        : null;
      const fullTimerDuration =
        initialFocusTime > 0 ? initialFocusTime * 60 : focusTime * 60;
      const newSession: FocusSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        focusTime: fullTimerDuration,
        breakTime: 0,
        completedCycles: newCompletedCycles,
        taskName: selectedTaskForHistory?.text,
        taskId: selectedTaskForHistory?.id,
      };
      setSessions((prev) => [newSession, ...prev]);

      setTimeout(() => {
        stopTimer();
      }, 100);

      if (enableBreaks && shortBreak > 0) {
        setTimeout(() => {
          const breakTime = shortBreak * 60;
          setIsBreak(true);
          setTimeLeft(breakTime);
          setOriginalSessionTime(breakTime);
          setCurrentSessionTime(0);
          setShowFocusPopup(false);
        }, 150);
      } else {
        setTimeout(() => {
          const nextFocusTime = initialFocusTime * 60;
          setTimeLeft(nextFocusTime);
          setOriginalSessionTime(nextFocusTime);
          setCurrentSessionTime(0);
          setShowFocusPopup(false);
        }, 150);
      }
    } else {
      setTimeout(() => {
        stopTimer();
      }, 100);

      setTimeout(() => {
        const nextFocusTime = initialFocusTime * 60;
        setIsBreak(false);
        setTimeLeft(nextFocusTime);
        setOriginalSessionTime(nextFocusTime);
        setCurrentSessionTime(0);
        setShowFocusPopup(false);
      }, 150);
    }
  }, [
    isBreak,
    completedCycles,
    focusTime,
    initialFocusTime,
    sessionTaskId,
    tasks,
    enableBreaks,
    shortBreak,
    stopTimer,
  ]);

  // Then define startTimer and pauseTimer
  const startTimer = useCallback(() => {
    setIsRunning(true);

    if (selectedTaskId && !isBreak) {
      setSessionTaskId(selectedTaskId);
      setShowFocusPopup(true);
      setIsMinimized(false);
    }
  }, [selectedTaskId, isBreak]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);

    // Save current session time to the active task when pausing
    if (sessionTaskId && currentSessionTime > 0 && !isBreak) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === sessionTaskId
            ? { ...task, timeWorked: task.timeWorked + currentSessionTime }
            : task,
        ),
      );
      setCurrentSessionTime(0); // Reset session time after saving
    }

    if (!isBreak) {
      setShowFocusPopup(false);
    }
  }, [sessionTaskId, currentSessionTime, isBreak]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    const resetFocusTime = completedCycles > 0 ? initialFocusTime : focusTime;
    const focusTimeSeconds = resetFocusTime * 60;
    setTimeLeft(focusTimeSeconds);
    setOriginalSessionTime(focusTimeSeconds);
    setCompletedCycles(0);
    setCurrentSessionTime(0);
    setShowFocusPopup(false);
    setSessionTaskId(null);
  }, [completedCycles, initialFocusTime, focusTime]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: selectedTimezone,
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
  }, [selectedTimezone]);

  useEffect(() => {
    const createBeepSound = () => {
      const AudioContext =
        window.AudioContext || (window as WindowWithAudio).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    audioRef.current = { play: createBeepSound };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });

        setCurrentSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleSessionComplete]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).contentEditable === "true");

      if (event.code === "Space" && !isEditingTimer && !isTyping) {
        event.preventDefault();
        if (selectedTaskId && !isBreak) {
          if (isRunning) {
            pauseTimer();
          } else {
            startTimer();
          }
        } else {
          if (isRunning) {
            pauseTimer();
          } else {
            startTimer();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isRunning,
    isEditingTimer,
    selectedTaskId,
    isBreak,
    pauseTimer,
    startTimer,
  ]);

  const startEditingTimer = () => {
    if (!isRunning) {
      setIsEditingTimer(true);
      setEditTimeValue("");
    }
  };

  const saveTimerEdit = () => {
    const newMinutes = Number.parseInt(editTimeValue);
    if (newMinutes > 0 && newMinutes <= 240) {
      const newTime = newMinutes * 60;
      setTimeLeft(newTime);
      setOriginalSessionTime(newTime);
      setCurrentSessionTime(0);
      setFocusTime(newMinutes);
      if (completedCycles === 0) {
        setInitialFocusTime(newMinutes);
      }
    }
    setIsEditingTimer(false);
  };

  const cancelTimerEdit = () => {
    setIsEditingTimer(false);
    setEditTimeValue("");
  };

  const handleTimerEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTimerEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelTimerEdit();
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false,
        timeWorked: 0,
      };
      setTasks((prev) => [task, ...prev]);
      setNewTask("");
    }
  };

  const toggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      const completedTaskSession: FocusSession = {
        id: `completed-${Date.now()}`,
        date: new Date().toISOString(),
        focusTime: task.timeWorked,
        breakTime: 0,
        completedCycles: 0,
        taskName: `✅ ${task.text} (Completed)`,
        taskId: task.id,
      };
      setSessions((prev) => [completedTaskSession, ...prev]);

      const AudioContext =
        window.AudioContext || (window as WindowWithAudio).webkitAudioContext;
      if (!AudioContext) return;

      const celebrationAudio = new AudioContext();
      const oscillator = celebrationAudio.createOscillator();
      const gainNode = celebrationAudio.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(celebrationAudio.destination);

      oscillator.frequency.setValueAtTime(523, celebrationAudio.currentTime);
      oscillator.frequency.setValueAtTime(
        659,
        celebrationAudio.currentTime + 0.1,
      );
      oscillator.frequency.setValueAtTime(
        784,
        celebrationAudio.currentTime + 0.2,
      );
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, celebrationAudio.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        celebrationAudio.currentTime + 0.4,
      );

      oscillator.start(celebrationAudio.currentTime);
      oscillator.stop(celebrationAudio.currentTime + 0.4);

      const emojiElement = document.createElement("div");
      emojiElement.textContent = "🎉";
      emojiElement.style.position = "fixed";
      emojiElement.style.fontSize = "2rem";
      emojiElement.style.zIndex = "9999";
      emojiElement.style.pointerEvents = "none";
      emojiElement.style.left = "50%";
      emojiElement.style.top = "50%";
      emojiElement.style.transform = "translate(-50%, -50%)";
      emojiElement.style.animation = "bounce 0.6s ease-out";

      document.body.appendChild(emojiElement);
      setTimeout(() => document.body.removeChild(emojiElement), 600);
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );

    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  const clearCompletedTasks = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  const clearNotepad = () => {
    setNotepadContent("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("focusTimer_notes");
    }
  };

  const clearHistory = () => {
    setSessions([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("focusTimer_sessions");
    }
    setShowDeleteConfirm(false);
  };

  const copyHistory = async () => {
    if (sessions.length === 0) return;

    const historyText = sessions
      .map((session) => {
        const date = new Date(session.date).toLocaleDateString();
        const time = new Date(session.date).toLocaleTimeString();
        const timeInfo = session.taskName?.includes("✅")
          ? formatTimeWorked(session.focusTime)
          : formatTime(session.focusTime);
        const cycleInfo =
          session.completedCycles > 0
            ? ` (${session.completedCycles} cycles)`
            : "";
        const taskInfo = session.taskName ? ` - ${session.taskName}` : "";
        return `${date} ${time} - ${timeInfo}${cycleInfo}${taskInfo}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(historyText);
      setShowCopyNotification(true);
      setCopyButtonText("Copied");
      setTimeout(() => {
        setCopyButtonText("Copy");
        setShowCopyNotification(false);
      }, 500);
    } catch (err) {
      console.error("Failed to copy history:", err);
    }
  };

  const selectTask = (taskId: string) => {
    if (tasks.find((t) => t.id === taskId)?.completed) return;

    // Save current session time to previous task when switching tasks
    if (
      sessionTaskId &&
      sessionTaskId !== taskId &&
      currentSessionTime > 0 &&
      !isBreak
    ) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === sessionTaskId
            ? { ...task, timeWorked: task.timeWorked + currentSessionTime }
            : task,
        ),
      );
      setCurrentSessionTime(0); // Reset session time for new task
    }

    setSelectedTaskId(selectedTaskId === taskId ? null : taskId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeWorked = (
    seconds: number,
    includeCurrentSession = false,
    taskId?: string,
  ) => {
    let totalSeconds = seconds;

    if (
      includeCurrentSession &&
      taskId === sessionTaskId &&
      currentSessionTime > 0 &&
      !isBreak
    ) {
      totalSeconds += currentSessionTime;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getProgress = () => {
    if (originalSessionTime === 0) return 0;
    if (timeLeft === 0 && !isRunning) return 0;
    const progress =
      ((originalSessionTime - timeLeft) / originalSessionTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const sessionTask = selectedTaskId
    ? tasks.find((t) => t.id === sessionTaskId)
    : null;

  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasContent =
    tasks.length > 0 ||
    notepadContent.trim().length > 0 ||
    sessions.length > 0 ||
    isRunning;

  return (
    <TooltipProvider>
      <div className="mx-auto flex h-screen w-full flex-col p-1">
        <Card
          className={`w-full overflow-hidden transition-all duration-300 ${
            hasContent ? "h-auto max-h-screen md:h-full" : "h-auto max-h-[80vh]"
          }`}
        >
          <CardHeader className="px-4 py-2 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-4 w-4" />
                Focus Timer
              </CardTitle>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground h-6 px-1 transition-colors hover:text-orange-600"
                      onClick={() =>
                        window.open(
                          "https://buymeacoffee.com/troyvallarta",
                          "_blank",
                        )
                      }
                    >
                      <Coffee className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Buy me a coffee ☕</p>
                  </TooltipContent>
                </Tooltip>
                <div className="text-muted-foreground font-mono text-base font-semibold">
                  {currentTime}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-6 px-1"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {timezones.map((timezone) => (
                      <DropdownMenuItem
                        key={timezone.value}
                        onClick={() => setSelectedTimezone(timezone.value)}
                        className={
                          selectedTimezone === timezone.value
                            ? "bg-blue-50 text-blue-700"
                            : ""
                        }
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
                        className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
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
          <CardContent className="flex flex-1 flex-col overflow-y-auto px-4 pt-0 pb-2">
            <Tabs defaultValue="timer" className="flex w-full flex-1 flex-col">
              <TabsList className="mb-2 grid w-full grid-cols-2">
                <TabsTrigger value="timer">Timer</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent
                value="timer"
                className="flex flex-1 flex-col space-y-3"
              >
                <TimerSection
                  timeLeft={timeLeft}
                  isRunning={isRunning}
                  isBreak={isBreak}
                  completedCycles={completedCycles}
                  isEditingTimer={isEditingTimer}
                  editTimeValue={editTimeValue}
                  enableBreaks={enableBreaks}
                  shortBreak={shortBreak}
                  showSettings={!isRunning}
                  onStart={startTimer}
                  onPause={pauseTimer}
                  onStop={stopTimer}
                  onReset={resetTimer}
                  onStartEdit={startEditingTimer}
                  onSaveEdit={saveTimerEdit}
                  onCancelEdit={cancelTimerEdit}
                  onEditValueChange={setEditTimeValue}
                  onEditKeyDown={handleTimerEditKeyDown}
                  onEnableBreaksChange={(enabled) => {
                    setEnableBreaks(enabled);
                    if (enabled && shortBreak === 0) {
                      setShortBreak(5);
                    }
                  }}
                  onShortBreakChange={(value) => {
                    setShortBreak(value);
                    if (value === 0) {
                      setEnableBreaks(false);
                    }
                  }}
                  getProgress={getProgress}
                  formatTime={formatTime}
                  focusTime={focusTime}
                  onFocusTimeChange={(value) => {
                    setFocusTime(value);
                    const newTime = value * 60;
                    if (!isRunning) {
                      setTimeLeft(newTime);
                      setOriginalSessionTime(newTime);
                      if (completedCycles === 0) {
                        setInitialFocusTime(value);
                      }
                    }
                  }}
                />

                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="order-1 md:order-1">
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
                  </div>

                  <div className="order-2 md:order-2">
                    <BrainDumpComponent
                      notepadContent={notepadContent}
                      onContentChange={setNotepadContent}
                      onClear={clearNotepad}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="history"
                className="flex-1 space-y-3 overflow-y-auto"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Focus History</h3>
                  {sessions.length > 0 && (
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={copyHistory}
                            size="sm"
                            variant="outline"
                            className="h-7 bg-transparent px-2"
                          >
                            {copyButtonText}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy history logs</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            size="sm"
                            variant="outline"
                            className="h-7 bg-transparent px-2 text-red-600 hover:text-red-700"
                          >
                            Clear
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete all history logs</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Card className="mx-4 w-full max-w-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          Confirm Delete
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                          Are you sure you want to delete all history logs? This
                          action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowDeleteConfirm(false)}
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setShowDeleteConfirm(false);
                              }
                            }}
                            autoFocus
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={clearHistory}
                            variant="destructive"
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                clearHistory();
                              }
                            }}
                          >
                            Delete All
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {sessions.length === 0 ? (
                  <div className="text-muted-foreground py-6 text-center text-sm">
                    No focus sessions yet. Complete a focus session to see your
                    history!
                  </div>
                ) : (
                  sessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="px-4 pt-3 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(session.date).toLocaleDateString()}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {new Date(session.date).toLocaleTimeString()}
                            </div>
                            {session.taskName && (
                              <div
                                className={`mt-1 text-xs font-medium ${
                                  session.taskName.includes("✅")
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {session.taskName.includes("✅") ? "✅" : "📋"}{" "}
                                {session.taskName
                                  .replace("✅ ", "")
                                  .replace(" (Completed)", "")}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {session.taskName?.includes("✅")
                                ? formatTimeWorked(session.focusTime)
                                : formatTime(session.focusTime)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {session.taskName?.includes("✅")
                                ? "Task Completed"
                                : "Focus Session"}
                            </div>
                            {session.completedCycles > 0 && (
                              <div className="text-muted-foreground text-xs">
                                {session.completedCycles} cycles
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {showFocusPopup && sessionTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card
              className={`mx-4 w-full max-w-md ${isMinimized ? "h-20" : ""} transition-all duration-300`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Focus Mode</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowFocusPopup(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="mb-2 font-mono text-4xl font-bold">
                      {formatTime(timeLeft)}
                    </div>
                    <Progress
                      value={getProgress()}
                      className="mb-4 h-2 w-full"
                    />
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="mb-1 font-medium text-blue-900">
                      Current Focus Task:
                    </div>
                    <div className="text-blue-800">{sessionTask.text}</div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-blue-600">
                      <Clock className="h-3 w-3" />
                      Total time worked:{" "}
                      {formatTimeWorked(
                        sessionTask.timeWorked,
                        true,
                        sessionTask.id,
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isRunning ? (
                      <Button onClick={pauseTimer} className="flex-1">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={startTimer} className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    )}

                    <Button
                      onClick={stopTimer}
                      variant="outline"
                      className="flex-1 bg-transparent"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {showCopyNotification && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
            <div className="h-2 w-2 rounded-full bg-white"></div>
            <span className="text-sm font-medium">
              History copied to clipboard!
            </span>
          </div>
        )}

        <style jsx>{`
          @keyframes bounce {
            0%,
            20%,
            53%,
            80%,
            100% {
              transform: translate(-50%, -50%) scale(1);
            }
            40%,
            43% {
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
  );
}
