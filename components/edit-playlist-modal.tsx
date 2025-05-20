"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { savePlaylist } from "@/lib/playlist-storage"
import type { Playlist } from "@/lib/types"

interface EditPlaylistModalProps {
  playlist: Playlist
  onClose: () => void
  onSave: (playlist: Playlist) => void
}

export default function EditPlaylistModal({ playlist, onClose, onSave }: EditPlaylistModalProps) {
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("O nome da playlist é obrigatório")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const updatedPlaylist: Playlist = {
        ...playlist,
        name: name.trim(),
        description: description.trim() || undefined,
        updatedAt: Date.now(),
      }

      await savePlaylist(updatedPlaylist)
      onSave(updatedPlaylist)
    } catch (error) {
      console.error("Erro ao atualizar playlist:", error)
      setError("Erro ao atualizar playlist. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Editar Playlist</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label htmlFor="playlist-name">Nome da Playlist</label>
              <input
                type="text"
                id="playlist-name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Minha Playlist"
                maxLength={50}
                required
              />
            </div>

            <div className="form-group mt-3">
              <label htmlFor="playlist-description">Descrição (opcional)</label>
              <textarea
                id="playlist-description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição para sua playlist"
                maxLength={200}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
