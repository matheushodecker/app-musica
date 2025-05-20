"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X, Plus, Check } from "lucide-react"
import { loadPlaylists, addMusicToPlaylist, savePlaylist, generateRandomColor } from "@/lib/playlist-storage"
import type { Playlist } from "@/lib/types"

interface AddToPlaylistModalProps {
  musicId: string
  onClose: () => void
  onPlaylistCreated?: (playlist: Playlist) => void
}

export default function AddToPlaylistModal({ musicId, onClose, onPlaylistCreated }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")

  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsLoading(true)
      try {
        const userPlaylists = await loadPlaylists()
        setPlaylists(userPlaylists)
      } catch (error) {
        console.error("Erro ao carregar playlists:", error)
        setError("Erro ao carregar playlists. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      setError("Selecione uma playlist")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await addMusicToPlaylist(selectedPlaylistId, musicId)

      const playlistName = playlists.find((p) => p.id === selectedPlaylistId)?.name
      setSuccess(`Música adicionada à playlist "${playlistName}"`)

      // Limpar seleção após sucesso
      setSelectedPlaylistId(null)

      // Fechar modal após um breve delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Erro ao adicionar música à playlist:", error)
      setError("Erro ao adicionar música. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPlaylistName.trim()) {
      setError("O nome da playlist é obrigatório")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name: newPlaylistName.trim(),
        coverColor: generateRandomColor(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        musicIds: [musicId], // Já adiciona a música à nova playlist
      }

      await savePlaylist(newPlaylist)

      // Atualizar a lista de playlists
      setPlaylists((prev) => [...prev, newPlaylist])

      // Limpar o formulário
      setNewPlaylistName("")
      setShowCreateForm(false)

      // Mostrar mensagem de sucesso
      setSuccess(`Música adicionada à nova playlist "${newPlaylist.name}"`)

      // Notificar o componente pai sobre a nova playlist
      if (onPlaylistCreated) {
        onPlaylistCreated(newPlaylist)
      }

      // Fechar modal após um breve delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Erro ao criar playlist:", error)
      setError("Erro ao criar playlist. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Adicionar à Playlist</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {success && <div className="alert alert-success">{success}</div>}

          {isLoading ? (
            <div className="text-center py-4">
              <div className="spinner"></div>
              <p className="mt-3">Carregando playlists...</p>
            </div>
          ) : (
            <>
              {!showCreateForm ? (
                <>
                  {playlists.length === 0 ? (
                    <div className="text-center py-4">
                      <p>Você ainda não tem playlists.</p>
                    </div>
                  ) : (
                    <div className="playlist-selection">
                      {playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className={`playlist-selection-item ${selectedPlaylistId === playlist.id ? "selected" : ""}`}
                          onClick={() => setSelectedPlaylistId(playlist.id)}
                        >
                          <div
                            className="playlist-selection-color"
                            style={{ backgroundColor: playlist.coverColor || "#ff2e97" }}
                          ></div>
                          <div className="playlist-selection-name">
                            {playlist.name}
                            <span className="playlist-selection-count">
                              {playlist.musicIds.length} {playlist.musicIds.length === 1 ? "música" : "músicas"}
                            </span>
                          </div>
                          {selectedPlaylistId === playlist.id && (
                            <div className="playlist-selection-check">
                              <Check size={18} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="btn btn-outline-primary w-100 mt-3" onClick={() => setShowCreateForm(true)}>
                    <Plus size={18} className="me-2" />
                    Criar Nova Playlist
                  </button>

                  {playlists.length > 0 && (
                    <button
                      className="btn btn-primary w-100 mt-3"
                      onClick={handleAddToPlaylist}
                      disabled={!selectedPlaylistId || isSubmitting}
                    >
                      {isSubmitting ? "Adicionando..." : "Adicionar à Playlist Selecionada"}
                    </button>
                  )}
                </>
              ) : (
                <form onSubmit={handleCreatePlaylist}>
                  <div className="form-group">
                    <label htmlFor="new-playlist-name">Nome da Nova Playlist</label>
                    <input
                      type="text"
                      id="new-playlist-name"
                      className="form-control"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Minha Nova Playlist"
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isSubmitting}
                    >
                      Voltar
                    </button>
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={isSubmitting}>
                      {isSubmitting ? "Criando..." : "Criar e Adicionar"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
