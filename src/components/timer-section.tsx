"use client";

import type React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Play, Pause, Square, Clock, Check, X, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";

interface TimerSectionProps {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  completedCycles: number;
  isEditingTimer: boolean;
  editTimeValue: string;
  enableBreaks: boolean;
  shortBreak: number;
  longBreak: number;
  cyclesUntilLongBreak: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onEditKeyDown: (e: React.KeyboardEvent) => void;
  onEnableBreaksChange: (enabled: boolean) => void;
  onShortBreakChange: (minutes: number) => void;
  onLongBreakChange: (minutes: number) => void;
  onCyclesUntilLongBreakChange: (cycles: number) => void;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
}

export function TimerSection({
  timeLeft,
  isRunning,
  isBreak,
  completedCycles,
  isEditingTimer,
  editTimeValue,
  enableBreaks,
  shortBreak,
  longBreak,
  cyclesUntilLongBreak,
  onStart,
  onPause,
  onStop,
  onReset,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onEditKeyDown,
  onEnableBreaksChange,
  onShortBreakChange,
  onLongBreakChange,
  onCyclesUntilLongBreakChange,
  getProgress,
  formatTime,
}: TimerSectionProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2 text-center">
        <div className="relative flex items-center justify-center">
          {isEditingTimer ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                value={editTimeValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onKeyDown={onEditKeyDown}
                className="h-12 w-24 text-center font-mono text-3xl font-bold"
                min="1"
                max="120"
                autoFocus
              />
              <span className="font-mono text-3xl font-bold">min</span>
              <div className="ml-2 flex flex-col gap-1">
                <Button size="sm" onClick={onSaveEdit} className="h-6 w-6 p-0">
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEdit}
                  className="h-6 w-6 bg-transparent p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    {!isRunning ? (
                      <Button
                        onClick={onStart}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={onPause}
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{!isRunning ? "Start" : "Pause"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onStop}
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 bg-transparent p-0"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Stop</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Timer display */}
              <div className="flex items-center gap-3">
                <div
                  className="cursor-pointer font-mono text-6xl font-bold transition-colors hover:text-blue-600"
                  onClick={!isRunning ? onStartEdit : undefined}
                  title={
                    !isRunning
                      ? "Click to edit time"
                      : "Stop timer to edit time"
                  }
                >
                  {isBreak
                    ? formatTime(
                        enableBreaks
                          ? (completedCycles % cyclesUntilLongBreak === 0
                              ? longBreak
                              : shortBreak) * 60
                          : timeLeft,
                      )
                    : formatTime(timeLeft)}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="text-sm font-semibold">
                        Timer Settings
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableBreaks"
                          checked={enableBreaks}
                          onChange={(e) =>
                            onEnableBreaksChange(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="enableBreaks"
                          className="text-sm font-medium"
                        >
                          Enable breaks between focus sessions
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Short Break (min)
                          </label>
                          <Input
                            type="number"
                            value={shortBreak}
                            onChange={(e) =>
                              onShortBreakChange(Number(e.target.value))
                            }
                            min="1"
                            max="30"
                            disabled={!enableBreaks}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Long Break (min)
                          </label>
                          <Input
                            type="number"
                            value={longBreak}
                            onChange={(e) =>
                              onLongBreakChange(Number(e.target.value))
                            }
                            min="1"
                            max="60"
                            disabled={!enableBreaks}
                            className="h-8"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Cycles until Long Break
                          </label>
                          <Input
                            type="number"
                            value={cyclesUntilLongBreak}
                            onChange={(e) =>
                              onCyclesUntilLongBreakChange(
                                Number(e.target.value),
                              )
                            }
                            min="2"
                            max="10"
                            disabled={!enableBreaks}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Progress value={getProgress()} className="h-2 w-full" />
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <Badge
              variant={isBreak ? "secondary" : "default"}
              className="px-2 py-0 text-xs"
            >
              {isBreak ? "Break Time" : "Focus Time"}
            </Badge>
            <span>•</span>
            <span>Cycle {completedCycles + 1}</span>
            {completedCycles >= 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onReset}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground ml-1 h-4 w-4 p-0"
                  >
                    <Clock className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset cycles</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
