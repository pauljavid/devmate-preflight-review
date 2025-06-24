"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare } from "lucide-react"

interface Comment {
  id: string
  severity: "⚠️" | "💡" | "❗"
  code: string[]
  message: string
}

interface FileItem {
  name: string
  commentCount: number
  comments: Comment[]
}

const files: FileItem[] = [
  {
    name: "app.js",
    commentCount: 2,
    comments: [
      {
        id: "1",
        severity: "⚠️",
        code: ["const userData = fetchUser();", "console.log(userData);"],
        message: "Consider adding error handling for the API call",
      },
      {
        id: "2",
        severity: "💡",
        code: ["const x = 5;", "const y = x * 2;"],
        message: "Consider renaming this variable for clarity",
      },
    ],
  },
  {
    name: "utils.ts",
    commentCount: 1,
    comments: [
      {
        id: "3",
        severity: "❗",
        code: ["function processData(data) {", "  return data.map(item => item.value);", "}"],
        message: "Missing type annotations - this could cause runtime errors",
      },
    ],
  },
  {
    name: "components/Header.jsx",
    commentCount: 0,
    comments: [],
  },
  {
    name: "styles/globals.css",
    commentCount: 0,
    comments: [],
  },
]

export default function DeveloperTool() {
  const [activeFile, setActiveFile] = useState(files[0])
  const totalComments = files.reduce((sum, file) => sum + file.commentCount, 0)

  const getBadgeColor = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-500"
    if (count <= 2) return "bg-blue-100 text-blue-700"
    return "bg-orange-100 text-orange-700"
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium">Pre‑Flight Review</Button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">{totalComments} unresolved comments</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Pane - File Tree */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Files</h3>
          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  activeFile.name === file.name
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                </div>
                {file.commentCount > 0 && (
                  <Badge variant="secondary" className={`text-xs px-2 py-1 ${getBadgeColor(file.commentCount)}`}>
                    {file.commentCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane - Comments */}
        <div className="flex-1 bg-white p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{activeFile.name}</h2>
            <p className="text-sm text-gray-500">
              {activeFile.commentCount === 0
                ? "No comments for this file"
                : `${activeFile.commentCount} comment${activeFile.commentCount > 1 ? "s" : ""} to review`}
            </p>
          </div>

          {activeFile.comments.length > 0 ? (
            <div className="space-y-6">
              {activeFile.comments.map((comment, index) => (
                <div key={comment.id}>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {/* Code Snippet */}
                    <div className="bg-white rounded border border-gray-200 p-3 mb-4">
                      <pre className="text-sm font-mono text-gray-800 leading-relaxed">
                        {comment.code.map((line, lineIndex) => (
                          <div key={lineIndex} className="whitespace-pre-wrap">
                            {line}
                          </div>
                        ))}
                      </pre>
                    </div>

                    {/* Comment Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-lg">{comment.severity}</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.message}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        Accept Suggestion
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        Edit Code
                      </Button>
                    </div>
                  </div>

                  {/* Separator line */}
                  {index < activeFile.comments.length - 1 && <div className="border-b border-gray-100 my-6"></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">All clear!</h3>
              <p className="text-gray-500">No comments to review for this file.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
