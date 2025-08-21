"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { FileText, Trash2, Copy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip"

interface BrainDumpProps {
  notepadContent: string
  onContentChange: (content: string) => void
  onClear: () => void
}

export function BrainDumpComponent({ notepadContent, onContentChange, onClear }: BrainDumpProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notepadContent)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const hasContent = notepadContent.trim().length > 0
  const cardHeight = hasContent ? "h-full max-h-[calc(100vh-200px)]" : "h-auto"

  return (
    <TooltipProvider>
      <Card className={`flex flex-col ${cardHeight} overflow-hidden`}>
        <CardHeader className="pb-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Brain Dump
            </CardTitle>
            {notepadContent.trim() && (
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-600 hover:text-black hover:bg-gray-100"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy notes</p>
                  </TooltipContent>
                </Tooltip>
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
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent
          className={`px-3 py-0 pb-2 flex flex-col ${hasContent ? "flex-1 max-h-[calc(100vh-200px)] overflow-hidden" : "flex-shrink-0"}`}
        >
          <div className={`relative flex flex-col ${hasContent ? "flex-1 overflow-hidden" : "flex-shrink-0"}`}>
            <Textarea
              value={notepadContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write your notes here..."
              className={`border rounded-md resize-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-white ${
                hasContent ? "flex-1 overflow-y-auto" : "h-24"
              }`}
              style={{
                lineHeight: "1.5",
                fontSize: "12px",
                padding: "12px",
              }}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
