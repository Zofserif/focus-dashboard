"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { FileText, Trash2, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import { useState, useEffect } from "react";

interface BrainDumpProps {
  notepadContent: string;
  onContentChange: (content: string) => void;
  onClear: () => void;
}

export function BrainDumpComponent({
  notepadContent,
  onContentChange,
  onClear,
}: BrainDumpProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showDeleteConfirm) {
        if (event.key === "Escape") {
          setShowDeleteConfirm(false);
        } else if (event.key === "Enter") {
          onClear();
          setShowDeleteConfirm(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteConfirm, onClear]);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notepadContent);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const hasContent = notepadContent.trim().length > 0;
  const cardHeight = hasContent ? "h-full max-h-[calc(100vh-200px)]" : "h-auto";

  return (
    <TooltipProvider>
      <Card className={`flex flex-col ${cardHeight} overflow-hidden`}>
        <CardHeader className="px-3 py-2 pb-2">
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
                      className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-black"
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
                      onClick={() => setShowDeleteConfirm(true)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-black"
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
          className={`flex flex-col px-3 py-0 pb-2 ${hasContent ? "max-h-[calc(100vh-200px)] flex-1 overflow-hidden" : "flex-shrink-0"}`}
        >
          <div
            className={`relative flex flex-col ${hasContent ? "flex-1 overflow-hidden" : "flex-shrink-0"}`}
          >
            <Textarea
              value={notepadContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write your notes here..."
              className={`resize-none rounded-md border bg-white text-sm focus:ring-2 focus:ring-blue-500 ${
                hasContent ? "flex-1 overflow-y-auto" : "h-24"
              }`}
              style={{
                padding: "8px",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All Notes</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all notes? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              autoFocus
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onClear();
                setShowDeleteConfirm(false);
              }}
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
