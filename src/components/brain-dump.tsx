"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { FileText, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip"
import { useRef } from "react"

interface BrainDumpProps {
  notepadContent: string
  onContentChange: (content: string) => void
  onClear: () => void
}

export function BrainDumpComponent({ notepadContent, onContentChange, onClear }: BrainDumpProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const generateLineNumbers = (content: string) => {
    const lines = content.split("\n")
    return lines.map((_, index) => index + 1)
  }

  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  return (
    <TooltipProvider>
      <Card className="flex flex-col">
        <CardHeader className="pb-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Brain Dump
            </CardTitle>
            {notepadContent.trim() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onClear}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-600 hover:text-black hover:bg-gray-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear all notes</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 py-0 pb-2 flex-1 flex flex-col max-h-[calc(100vh-200px)] overflow-hidden">
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <div className="flex border rounded-md overflow-hidden flex-1 max-h-full">
              <div
                ref={lineNumbersRef}
                className="bg-gray-50 border-r px-2 py-2 text-xs text-gray-500 font-mono select-none min-w-[2.5rem] text-right overflow-y-hidden"
                style={{
                  lineHeight: "1.25rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                }}
              >
                {generateLineNumbers(notepadContent).map((lineNum) => (
                  <div key={lineNum} style={{ height: "1.25rem" }}>
                    {lineNum}
                  </div>
                ))}
              </div>

              <Textarea
                value={notepadContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Write your notes here..."
                className="border-0 resize-none focus:ring-0 font-mono text-xs leading-5 rounded-none flex-1 overflow-y-auto"
                style={{
                  lineHeight: "1.25rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                }}
                onScroll={handleTextareaScroll}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
