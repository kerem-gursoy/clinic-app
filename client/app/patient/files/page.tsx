"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { Upload, FileText, Download, Trash2 } from "lucide-react"
import type { FileUpload } from "@/lib/types"

export default function PatientFilesPage() {
  const [files] = useState<FileUpload[]>([])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">My Files</h1>
          <p className="text-muted-foreground">Upload and manage your medical documents</p>
        </div>
        <Button className="rounded-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No files uploaded"
          description="Upload your insurance cards, medical records, and other documents."
          action={{
            label: "Upload File",
            onClick: () => console.log("[v0] Upload clicked"),
          }}
        />
      ) : (
        <div className="bg-card rounded-xl border">
          <div className="divide-y">
            {files.map((file) => (
              <div key={file.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* File Preview */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={file.url || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • Uploaded {formatDate(file.uploadedAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
