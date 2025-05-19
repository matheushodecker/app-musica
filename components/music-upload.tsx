"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileAudio, Loader } from "lucide-react"

interface MusicUploadProps {
  onUpload: (file: File) => void
  isUploading?: boolean
}

export default function MusicUpload({ onUpload, isUploading = false }: MusicUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (isUploading) return // Evitar uploads simultâneos

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("audio/")) {
        onUpload(file)
      } else {
        alert("Por favor, selecione apenas arquivos de áudio.")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return // Evitar uploads simultâneos

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type.startsWith("audio/")) {
        onUpload(file)
      } else {
        alert("Por favor, selecione apenas arquivos de áudio.")
      }
    }
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      className={`upload-area ${isDragging ? "drag-over" : ""} ${isUploading ? "uploading" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        style={{ display: "none" }}
        disabled={isUploading}
      />

      <div className="upload-icon">
        {isUploading ? (
          <Loader size={40} className="animate-spin" />
        ) : (
          <Upload size={40} className={`${isHovering ? "animate-bounce" : ""}`} />
        )}
      </div>

      <h3 className="mb-2">{isUploading ? "Processando arquivo..." : "Adicione suas músicas"}</h3>

      <p className="text-muted">
        {isUploading
          ? "Por favor, aguarde enquanto processamos seu arquivo de áudio."
          : "Arraste e solte arquivos de áudio aqui ou clique para selecionar arquivos do seu dispositivo"}
      </p>

      {!isUploading && (
        <div className="format-badges">
          <div className="format-badge">
            <FileAudio size={14} className="me-1" /> MP3
          </div>
          <div className="format-badge">
            <FileAudio size={14} className="me-1" /> WAV
          </div>
          <div className="format-badge">
            <FileAudio size={14} className="me-1" /> OGG
          </div>
          <div className="format-badge">
            <FileAudio size={14} className="me-1" /> AAC
          </div>
        </div>
      )}
    </div>
  )
}
