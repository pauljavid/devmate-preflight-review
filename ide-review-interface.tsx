"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Loader2, CheckCircle, Edit3, Eye, GitPullRequest, X, Check } from "lucide-react"

interface Comment {
  id: string
  severity: "⚠️" | "❗" | "💡"
  code: string[]
  message: string
  reviewed: boolean
  accepted: boolean
  edited: boolean
  manuallyResolved: boolean
  lineNumber: number
  suggestedFix?: string[]
}

interface FileItem {
  name: string
  commentCount: number
  comments: Comment[]
  content: string[]
}

interface InlineSuggestion {
  commentId: string
  lineNumber: number
  suggestion: string[]
}

const mockFiles: FileItem[] = [
  {
    name: "retryHandler.ts",
    commentCount: 4,
    content: [
      "export async function retryWithBackoff(",
      "  fn: () => Promise<any>,",
      "  maxRetries = 3",
      "): Promise<any> {",
      "  let attempt = 0;",
      "  while (attempt < maxRetries) {",
      "    try {",
      "      return await fn();",
      "    } catch (error) {",
      "      console.log('Retry failed:', error);",
      "      attempt++;",
      "      if (attempt < maxRetries) {",
      "        await new Promise(resolve =>",
      "          setTimeout(resolve, 1000 * attempt)",
      "        );",
      "      }",
      "    }",
      "  }",
      "  throw new Error('Max retries exceeded');",
      "}",
    ],
    comments: [
      {
        id: "1",
        severity: "❗",
        code: ["  maxRetries = 3"],
        message: "Hard-coded retry limit should be configurable via environment variable or parameter",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 3,
        suggestedFix: ["  maxRetries = process.env.RETRY_LIMIT ? parseInt(process.env.RETRY_LIMIT) : 3"],
      },
      {
        id: "2",
        severity: "⚠️",
        code: ["      console.log('Retry failed:', error);"],
        message: "Consider using proper logging library instead of console.log for production code",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 10,
        suggestedFix: ["      logger.warn('Retry failed:', { error: error.message, attempt });"],
      },
      {
        id: "3",
        severity: "💡",
        code: ["        await new Promise(resolve =>", "          setTimeout(resolve, 1000 * attempt)", "        );"],
        message: "Exponential backoff implementation looks good, consider adding jitter to prevent thundering herd",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 13,
        suggestedFix: [
          "        const jitter = Math.random() * 0.1;",
          "        const delay = (1000 * attempt) * (1 + jitter);",
          "        await new Promise(resolve => setTimeout(resolve, delay));",
        ],
      },
      {
        id: "4",
        severity: "⚠️",
        code: ["  throw new Error('Request failed');"],
        message: "Error message should include response status and statusText for better debugging",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 18,
        suggestedFix: ["  throw new Error(`Request failed: ${response.status} ${response.statusText}`);"],
      },
    ],
  },
  {
    name: "utils.ts",
    commentCount: 2,
    content: [
      "const API_KEY = process.env.API_KEY;",
      "if (!API_KEY) {",
      "  throw new Error('API_KEY required');",
      "}",
      "",
      "export const formatDate = (date: Date) => {",
      "  return date.toISOString().split('T')[0];",
      "}",
      "",
      "export const validateEmail = (email: string): boolean => {",
      "  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;",
      "  return emailRegex.test(email);",
      "}",
    ],
    comments: [
      {
        id: "5",
        severity: "💡",
        code: ["  return date.toISOString().split('T')[0];"],
        message: "Consider using a date formatting library like date-fns for better locale support",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 7,
        suggestedFix: ["  return format(date, 'yyyy-MM-dd');"],
      },
      {
        id: "6",
        severity: "⚠️",
        code: ["const API_KEY = process.env.API_KEY;"],
        message: "Environment variable validation should happen at application startup, not at runtime",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 1,
        suggestedFix: ["// Move to app startup - validateEnvironment()"],
      },
    ],
  },
  {
    name: "api/client.ts",
    commentCount: 1,
    content: [
      "export class ApiClient {",
      "  private baseUrl: string;",
      "",
      "  constructor(baseUrl: string) {",
      "    this.baseUrl = baseUrl;",
      "  }",
      "",
      "  async post(endpoint: string, data: any) {",
      "    const url = `${this.baseUrl}${endpoint}`;",
      "    const response = await fetch(url, {",
      "      method: 'POST',",
      "      body: JSON.stringify(data)",
      "    });",
      "",
      "    if (!response.ok) {",
      "      throw new Error('Request failed');",
      "    }",
      "",
      "    return response.json();",
      "  }",
      "}",
    ],
    comments: [
      {
        id: "7",
        severity: "❗",
        code: ["    const response = await fetch(url, {", "      method: 'POST',", "      body: JSON.stringify(data)"],
        message: "Missing Content-Type header - this will cause the API to reject the request",
        reviewed: false,
        accepted: false,
        edited: false,
        manuallyResolved: false,
        lineNumber: 10,
        suggestedFix: [
          "    const response = await fetch(url, {",
          "      method: 'POST',",
          "      headers: { 'Content-Type': 'application/json' },",
          "      body: JSON.stringify(data)",
        ],
      },
    ],
  },
  {
    name: "components/Header.tsx",
    commentCount: 0,
    content: [
      "import React from 'react';",
      "",
      "interface HeaderProps {",
      "  title: string;",
      "}",
      "",
      "export const Header: React.FC<HeaderProps> = ({ title }) => {",
      "  return (",
      '    <header className="bg-white shadow-sm">',
      '      <h1 className="text-2xl font-bold">{title}</h1>',
      "    </header>",
      "  );",
      "};",
    ],
    comments: [],
  },
]

type ViewState = "editor" | "loading" | "review"

export default function IDEReviewInterface() {
  const [viewState, setViewState] = useState<ViewState>("editor")
  const [selectedFile, setSelectedFile] = useState(mockFiles[0])
  const [files, setFiles] = useState(mockFiles)
  const [currentEditorFile, setCurrentEditorFile] = useState(mockFiles[0])
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
  const [editorSelectedFile, setEditorSelectedFile] = useState(mockFiles[0])
  const [editableContent, setEditableContent] = useState<string[]>(mockFiles[0].content)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [inlineSuggestion, setInlineSuggestion] = useState<InlineSuggestion | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [originalContent, setOriginalContent] = useState<string[]>(mockFiles[0].content)
  const editorRef = useRef<HTMLDivElement>(null)

  // Calculate stats
  const totalIssues = files.reduce((sum, file) => sum + file.commentCount, 0)
  const resolvedIssues = files.reduce(
    (sum, file) => sum + file.comments.filter((c) => c.reviewed || c.accepted || c.edited || c.manuallyResolved).length,
    0,
  )
  const unresolvedIssues = totalIssues - resolvedIssues

  const handlePreFlightReview = () => {
    setViewState("loading")
    setTimeout(() => {
      setViewState("review")
    }, 2000)
  }

  const handleBackToEditor = () => {
    setViewState("editor")
    setHighlightedLine(null)
    setInlineSuggestion(null)
  }

  // Accept suggestion - stay in review panel
  const handleAcceptSuggestion = (comment: Comment) => {
    const fileIndex = files.findIndex((f) => f.name === selectedFile.name)
    const updatedFiles = [...files]
    const commentToUpdate = updatedFiles[fileIndex].comments.find((c) => c.id === comment.id)

    if (commentToUpdate) {
      commentToUpdate.accepted = true
      setFiles(updatedFiles)

      // Update selected file if it's the same
      if (selectedFile.name === updatedFiles[fileIndex].name) {
        setSelectedFile(updatedFiles[fileIndex])
      }
    }
  }

  // Edit code - navigate to editor with inline suggestion
  const handleEditCode = (comment: Comment) => {
    const targetFile = files.find((f) => f.name === selectedFile.name)
    if (targetFile && comment.suggestedFix) {
      setCurrentEditorFile(targetFile)
      setEditableContent([...targetFile.content])
      setOriginalContent([...targetFile.content])
      setHighlightedLine(comment.lineNumber)
      setInlineSuggestion({
        commentId: comment.id,
        lineNumber: comment.lineNumber,
        suggestion: comment.suggestedFix,
      })
      setViewState("editor")

      // Scroll to line
      setTimeout(() => {
        if (editorRef.current) {
          const lineElement = editorRef.current.querySelector(`[data-line="${comment.lineNumber}"]`)
          if (lineElement) {
            lineElement.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }
      }, 100)
    }
  }

  const handleAcceptInlineSuggestion = () => {
    if (inlineSuggestion) {
      const updatedContent = [...editableContent]
      const lineIndex = inlineSuggestion.lineNumber - 1

      // Replace the line with the suggestion
      if (inlineSuggestion.suggestion.length === 1) {
        updatedContent[lineIndex] = inlineSuggestion.suggestion[0]
      } else {
        // Handle multi-line suggestions
        updatedContent.splice(lineIndex, 1, ...inlineSuggestion.suggestion)
      }

      setEditableContent(updatedContent)
      setInlineSuggestion(null)
      setHasUnsavedChanges(true)
    }
  }

  const handleRejectInlineSuggestion = () => {
    setInlineSuggestion(null)
  }

  const handlePushToReview = () => {
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const updateCommentState = (fileIndex: number, commentId: string, field: "reviewed") => {
    const updatedFiles = [...files]
    const comment = updatedFiles[fileIndex].comments.find((c) => c.id === commentId)
    if (comment) {
      comment[field] = !comment[field]
      setFiles(updatedFiles)
      if (selectedFile.name === updatedFiles[fileIndex].name) {
        setSelectedFile(updatedFiles[fileIndex])
      }
    }
  }

  const handleContentChange = (lineIndex: number, newContent: string) => {
    const updatedContent = [...editableContent]
    updatedContent[lineIndex] = newContent
    setEditableContent(updatedContent)

    // Check if content has changed from original
    const hasChanges = JSON.stringify(updatedContent) !== JSON.stringify(originalContent)
    setHasUnsavedChanges(hasChanges)
  }

  const getBadgeColor = (count: number, resolvedCount: number) => {
    if (count === 0) return "bg-gray-100 text-gray-500"
    if (resolvedCount === count) return "bg-green-100 text-green-700" // All resolved
    if (count <= 2) return "bg-blue-100 text-blue-700"
    return "bg-orange-100 text-orange-700"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "❗":
        return "text-red-600"
      case "⚠️":
        return "text-yellow-600"
      case "💡":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const renderCodeLine = (line: string, index: number) => {
    const lineNumber = index + 1
    const isHighlighted = highlightedLine === lineNumber
    const showSuggestion = inlineSuggestion && inlineSuggestion.lineNumber === lineNumber

    return (
      <div key={index} className="relative">
        <div
          data-line={lineNumber}
          className={`flex ${isHighlighted ? "bg-yellow-200 border-l-4 border-yellow-500" : ""}`}
        >
          <div className="w-12 text-right pr-4 text-gray-500 select-none text-sm leading-6">{lineNumber}</div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={line}
              onChange={(e) => handleContentChange(index, e.target.value)}
              className={`w-full bg-transparent border-none outline-none font-mono text-sm leading-6 text-gray-300 ${
                isHighlighted ? "text-gray-900" : ""
              }`}
              style={{ minWidth: "100%" }}
            />
          </div>
        </div>

        {/* Inline Suggestion */}
        {showSuggestion && (
          <div className="ml-12 mt-2 mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">💡 AI Suggestion:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptInlineSuggestion}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectInlineSuggestion}
                    className="text-gray-600 border-gray-300 text-xs px-2 py-1 h-6"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
              <pre className="text-sm font-mono text-yellow-900 bg-yellow-100 p-2 rounded border">
                {inlineSuggestion.suggestion.map((suggestionLine, idx) => (
                  <div key={idx}>{suggestionLine}</div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleResubmitToReview = () => {
    // Mark the comment as manually resolved if there was an inline suggestion
    if (inlineSuggestion) {
      const fileIndex = files.findIndex((f) => f.name === currentEditorFile.name)
      if (fileIndex !== -1) {
        const updatedFiles = [...files]
        const comment = updatedFiles[fileIndex].comments.find((c) => c.id === inlineSuggestion.commentId)
        if (comment) {
          comment.manuallyResolved = true
          comment.edited = true
          setFiles(updatedFiles)
        }
      }
    }

    // Update file content
    const fileIndex = files.findIndex((f) => f.name === currentEditorFile.name)
    if (fileIndex !== -1) {
      const updatedFiles = [...files]
      updatedFiles[fileIndex].content = editableContent
      setFiles(updatedFiles)
    }

    setHasUnsavedChanges(false)
    setInlineSuggestion(null)
    setHighlightedLine(null)

    // Show loading state then return to review
    setViewState("loading")
    setTimeout(() => {
      setViewState("review")
    }, 2000)
  }

  if (viewState === "editor") {
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{editorSelectedFile.name}</span>
            {highlightedLine && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                Line {highlightedLine}
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <div className="flex flex-col items-end">
                <Button
                  onClick={handleResubmitToReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
                >
                  Resubmit to Review
                </Button>
                <span className="text-xs text-gray-500 mt-1">Runs updated review on your changes</span>
              </div>
            ) : (
              <Button
                onClick={handlePreFlightReview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
              >
                Pre‑Flight Review
              </Button>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex">
          {/* Left Sidebar - File List */}
          <div className="w-48 bg-gray-800 border-r border-gray-700 p-2">
            <div className="space-y-1">
              {mockFiles.map((file) => (
                <div
                  key={file.name}
                  onClick={() => {
                    setEditorSelectedFile(file)
                    setEditableContent([...file.content])
                    setOriginalContent([...file.content])
                    setHasUnsavedChanges(false)
                    setInlineSuggestion(null)
                    setHighlightedLine(null)
                  }}
                  className={`px-3 py-2 rounded text-sm cursor-pointer transition-colors ${
                    editorSelectedFile.name === file.name
                      ? "bg-gray-700 text-gray-200 font-medium"
                      : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                  }`}
                >
                  {file.name}
                </div>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-gray-900 overflow-auto" ref={editorRef}>
            <div className="p-4">{editableContent.map((line, index) => renderCodeLine(line, index))}</div>
          </div>
        </div>
      </div>
    )
  }

  if (viewState === "loading") {
    return (
      <div className="h-screen bg-white flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{currentEditorFile.name}</span>
          </div>
          <Button disabled className="bg-gray-400 text-white px-4 py-2 text-sm font-medium cursor-not-allowed">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </Button>
        </div>

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Running Pre-Flight Review</h3>
            <p className="text-gray-600">LLama is conducting a code review of your updated code...</p>
          </div>
        </div>
      </div>
    )
  }

  // Group comments into resolved and unresolved
  const unresolvedComments = selectedFile.comments.filter(
    (c) => !c.reviewed && !c.accepted && !c.edited && !c.manuallyResolved,
  )
  const resolvedComments = selectedFile.comments.filter(
    (c) => c.reviewed || c.accepted || c.edited || c.manuallyResolved,
  )

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">✅ Pull Request Created (Mock)</span>
            <button onClick={() => setShowSuccessToast(false)} className="ml-2 text-green-600 hover:text-green-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={handleBackToEditor} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Editor
          </button>
          <div className="text-sm font-medium text-gray-800">{totalIssues} Issues Found</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="text-green-600 font-medium">{resolvedIssues} Resolved</span> /{" "}
            <span className="text-orange-600 font-medium">{unresolvedIssues} Unresolved</span>
          </div>
          <Button
            onClick={handlePushToReview}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium"
          >
            <GitPullRequest className="w-4 h-4 mr-2" />
            Push to Review
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Pane - File Tree */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Files</h3>
          <div className="space-y-1">
            {files.map((file) => {
              const fileResolvedCount = file.comments.filter(
                (c) => c.reviewed || c.accepted || c.edited || c.manuallyResolved,
              ).length

              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    selectedFile.name === file.name
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  </div>
                  {file.commentCount > 0 && (
                    <div className="flex items-center gap-1">
                      {fileResolvedCount === file.commentCount ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-2 py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />✓
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`text-xs px-2 py-1 ${getBadgeColor(file.commentCount - fileResolvedCount, fileResolvedCount)}`}
                        >
                          {file.commentCount - fileResolvedCount}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Pane - Comments */}
        <div className="flex-1 bg-white p-6 overflow-y-auto">
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{selectedFile.name}</h2>
              <p className="text-sm text-gray-500">
                {selectedFile.commentCount === 0
                  ? "No issues found"
                  : `${selectedFile.commentCount} issue${selectedFile.commentCount > 1 ? "s" : ""} found`}
              </p>
            </div>

            {selectedFile.commentCount > 0 && (
              <>
                {/* Unresolved Comments */}
                {unresolvedComments.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-md font-semibold text-gray-800 mb-4">Unresolved Issues</h3>
                    <div className="space-y-4">
                      {unresolvedComments.map((comment) => {
                        const fileIndex = files.findIndex((f) => f.name === selectedFile.name)
                        return (
                          <Card key={comment.id} className="border border-gray-200">
                            <CardContent className="p-4">
                              {/* Code Snippet */}
                              <div className="bg-gray-900 rounded-lg p-3 mb-4 overflow-x-auto">
                                <pre className="text-sm font-mono text-gray-300 leading-relaxed">
                                  {comment.code.map((line, lineIndex) => (
                                    <div key={lineIndex} className="whitespace-pre">
                                      <span className="text-gray-500 mr-3">{comment.lineNumber + lineIndex}</span>
                                      {line}
                                    </div>
                                  ))}
                                </pre>
                              </div>

                              {/* Comment */}
                              <div className="flex items-start gap-3 mb-4">
                                <span className={`text-lg ${getSeverityColor(comment.severity)}`}>
                                  {comment.severity}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed flex-1">{comment.message}</p>
                              </div>

                              {/* Suggested Fix */}
                              {comment.suggestedFix && (
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-blue-700">💡 Suggested Fix:</span>
                                  </div>
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 overflow-x-auto">
                                    <pre className="text-sm font-mono text-green-800 leading-relaxed">
                                      {comment.suggestedFix.map((line, lineIndex) => (
                                        <div key={lineIndex} className="whitespace-pre">
                                          {line}
                                        </div>
                                      ))}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCommentState(fileIndex, comment.id, "reviewed")}
                                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Mark Reviewed
                                </Button>
                                {comment.suggestedFix && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAcceptSuggestion(comment)}
                                    className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  >
                                    Accept Suggestion
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCode(comment)}
                                  className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Edit Code
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Resolved Comments */}
                {resolvedComments.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">Resolved Issues</h3>
                    <div className="space-y-4">
                      {resolvedComments.map((comment) => (
                        <Card key={comment.id} className="border border-gray-200 opacity-75">
                          <CardContent className="p-4">
                            {/* Status Badges */}
                            <div className="mb-3">
                              {comment.accepted && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs mr-2">✅ Accepted</Badge>
                              )}
                              {comment.manuallyResolved && (
                                <Badge className="bg-purple-100 text-purple-700 text-xs mr-2">✏️ Edited</Badge>
                              )}
                              {comment.reviewed && (
                                <Badge className="bg-green-100 text-green-700 text-xs">👁️ Reviewed</Badge>
                              )}
                            </div>

                            {/* Dimmed content */}
                            <div className="opacity-60">
                              <div className="bg-gray-900 rounded-lg p-3 mb-4 overflow-x-auto">
                                <pre className="text-sm font-mono text-gray-300 leading-relaxed">
                                  {comment.code.map((line, lineIndex) => (
                                    <div key={lineIndex} className="whitespace-pre line-through">
                                      <span className="text-gray-500 mr-3">{comment.lineNumber + lineIndex}</span>
                                      {line}
                                    </div>
                                  ))}
                                </pre>
                              </div>

                              <div className="flex items-start gap-3">
                                <span className={`text-lg ${getSeverityColor(comment.severity)}`}>
                                  {comment.severity}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed flex-1 line-through">
                                  {comment.message}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedFile.commentCount === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">All Clear!</h3>
                <p className="text-gray-500">No issues found in this file.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
