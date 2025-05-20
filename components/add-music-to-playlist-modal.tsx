"use client"

import { useEffect, useState } from "react"
import { X, Search, Plus, Check } from "lucide-react"
import { loadMusics } from "@/lib/music-storage"
import { addMusicToPlaylist } from "@/lib/playlist-storage"
import type { Music as MusicType, Playlist } from "@/lib/types"
import { Music } from "lucide-react"

interface AddMusicToPlaylistModalProps {
  playlist: Playlist
  onClose: () => void
  onMusicAdded: (updatedPlaylist: Playlist) => void
}

export default function AddMusicToPlaylistModal({ playlist, onClose, onMusicAdded }: AddMusicToPlaylistModalProps) {
  const [allMusics, setAllMusics] = useState<MusicType[]>([])
  const [availableMusics, setAvailableMusics] = useState<MusicType[]>([])
  const [selectedMusicIds, setSelectedMusicIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchMusics = async () => {
      setIsLoading(true)
      try {
        const musics = await loadMusics()
        setAllMusics(musics)

        // Filtrar músicas que já estão na playlist
        const available = musics.filter((music) => !playlist.musicIds.includes(music.id))
        setAvailableMusics(available)
      } catch (error) {
        console.error("Erro ao carregar músicas:", error)
        setError("Erro ao carregar músicas. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMusics()
  }, [playlist.musicIds])

  // Filtrar músicas com base no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      // Se não houver termo de busca, mostrar todas as músicas disponíveis
      const available = allMusics.filter((music) => !playlist.musicIds.includes(music.id))
      setAvailableMusics(available)
    } else {
      // Filtrar músicas com base no termo de busca
      const filtered = allMusics.filter(
        (music) =>
          !playlist.musicIds.includes(music.id) &&
          (music.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (music.artist && music.artist.toLowerCase().includes(searchTerm.toLowerCase()))),
      )
      setAvailableMusics(filtered)
    }
  }, [searchTerm, allMusics, playlist.musicIds])

  const toggleMusicSelection = (musicId: string) => {
    setSelectedMusicIds((prev) => (prev.includes(musicId) ? prev.filter((id) => id !== musicId) : [...prev, musicId]))
  }

  const handleAddMusics = async () => {
    if (selectedMusicIds.length === 0) {
      setError("Selecione pelo menos uma música para adicionar")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Criar uma cópia atualizada da playlist
      const updatedPlaylist = { ...playlist }

      // Adicionar cada música selecionada à playlist
      for (const musicId of selectedMusicIds) {
        await addMusicToPlaylist(playlist.id, musicId)
        updatedPlaylist.musicIds.push(musicId)
      }

      // Atualizar a data de modificação
      updatedPlaylist.updatedAt = Date.now()

      // Notificar o componente pai sobre as músicas adicionadas
      onMusicAdded(updatedPlaylist)

      // Fechar o modal
      onClose()
    } catch (error) {
      console.error("Erro ao adicionar músicas à playlist:", error)
      setError("Erro ao adicionar músicas. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Adicionar Músicas à Playlist</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="search-input-container mb-4">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar músicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")} aria-label="Limpar busca">
                &times;
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="spinner"></div>
              <p className="mt-3">Carregando músicas...</p>
            </div>
          ) : availableMusics.length === 0 ? (
            <div className="text-center py-4">
              <Music size={40} className="mb-3 text-muted" />
              <p>
                {searchTerm
                  ? "Nenhuma música encontrada para esta busca."
                  : "Todas as suas músicas já estão nesta playlist."}
              </p>
            </div>
          ) : (
            <div className="music-selection">
              {availableMusics.map((music) => (
                <div
                  key={music.id}
                  className={`music-selection-item ${selectedMusicIds.includes(music.id) ? "selected" : ""}`}
                  onClick={() => toggleMusicSelection(music.id)}
                >
                  <div className="music-selection-icon">
                    <Music size={20} />
                  </div>
                  <div className="music-selection-info">
                    <div className="music-selection-name">{music.name}</div>
                    <div className="music-selection-artist">{music.artist || "Arquivo local"}</div>
                  </div>
                  <div className="music-selection-duration">{formatDuration(music.duration)}</div>
                  <div className="music-selection-check">
                    {selectedMusicIds.includes(music.id) ? (
                      <Check size={18} />
                    ) : (
                      <Plus size={18} className="add-icon" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="selected-count">
            {selectedMusicIds.length > 0 && `${selectedMusicIds.length} música(s) selecionada(s)`}
          </div>
          <div>
            <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddMusics}
              disabled={selectedMusicIds.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Adicionando..." : "Adicionar Selecionadas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
