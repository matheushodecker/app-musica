"use client"

import { useEffect, useState } from "react"
import { loadPlaylists, removePlaylist } from "@/lib/playlist-storage"
import { loadMusics } from "@/lib/music-storage"
import type { Playlist, Music } from "@/lib/types"
import { Library, MusicIcon, ListMusic, Plus, Trash2, Play, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import MusicPlayer from "@/components/music-player"
import CreatePlaylistModal from "@/components/create-playlist-modal"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [musics, setMusics] = useState<Music[]>([])
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Carregamos as músicas primeiro
        const savedMusics = await loadMusics()
        setMusics(savedMusics)

        // Depois tentamos carregar as playlists
        try {
          const savedPlaylists = await loadPlaylists()
          setPlaylists(savedPlaylists)
        } catch (playlistError) {
          console.error("Erro ao carregar playlists:", playlistError)
          setError("Não foi possível carregar as playlists. Tente novamente mais tarde.")
          setPlaylists([])
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError("Ocorreu um erro ao carregar os dados. Verifique se seu navegador permite armazenamento local.")
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 800)
      }
    }

    loadData()
  }, [])

  const handleCreatePlaylist = (newPlaylist: Playlist) => {
    setPlaylists((prev) => [...prev, newPlaylist])
    setShowCreateModal(false)
  }

  const toggleDeleteMode = () => {
    setIsDeleting(!isDeleting)
    if (isDeleting) {
      setSelectedPlaylists([])
    }
  }

  const togglePlaylistSelection = (id: string) => {
    setSelectedPlaylists((prev) => (prev.includes(id) ? prev.filter((playlistId) => playlistId !== id) : [...prev, id]))
  }

  const handleDeleteSelected = async () => {
    if (selectedPlaylists.length === 0) return

    const confirmed = window.confirm(`Tem certeza que deseja excluir ${selectedPlaylists.length} playlist(s)?`)

    if (confirmed) {
      try {
        for (const id of selectedPlaylists) {
          await removePlaylist(id)
        }

        // Atualizar a lista de playlists
        setPlaylists((prev) => prev.filter((playlist) => !selectedPlaylists.includes(playlist.id)))
        setSelectedPlaylists([])
        setIsDeleting(false)
      } catch (error) {
        console.error("Erro ao excluir playlists:", error)
        alert("Erro ao excluir playlists. Tente novamente.")
      }
    }
  }

  // Função para calcular a duração total de uma playlist
  const calculatePlaylistDuration = (playlist: Playlist) => {
    const playlistMusics = musics.filter((music) => playlist.musicIds.includes(music.id))
    const totalSeconds = playlistMusics.reduce((total, music) => total + music.duration, 0)

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 0) {
      return `${hours} h ${minutes} min`
    }
    return `${minutes} min`
  }

  return (
    <main className="container-fluid p-0 music-app">
      <div className="row g-0">
        <div className="col-12">
          <header className="library-header">
            <div className="d-flex align-items-center">
              <ListMusic size={24} className="me-2" />
              <h1 className="library-title">Minhas Playlists</h1>
            </div>
            <div className="library-actions">
              <button className="btn-icon" onClick={() => setShowCreateModal(true)} title="Criar nova playlist">
                <Plus size={20} />
              </button>
              <button
                className={`btn-icon ${isDeleting ? "btn-danger" : ""}`}
                onClick={toggleDeleteMode}
                title={isDeleting ? "Cancelar exclusão" : "Excluir playlists"}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </header>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mx-4 mt-4">
          <AlertTriangle size={18} className="me-2" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-library">
          <div className="empty-icon">
            <ListMusic size={40} />
          </div>
          <h3>Nenhuma playlist criada</h3>
          <p>Crie sua primeira playlist para organizar suas músicas favoritas.</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowCreateModal(true)}>
            Criar Playlist
          </button>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist, index) => (
            <div
              key={playlist.id}
              className={`playlist-card ${selectedPlaylists.includes(playlist.id) ? "selected" : ""}`}
              onClick={() => (isDeleting ? togglePlaylistSelection(playlist.id) : null)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="playlist-cover" style={{ backgroundColor: playlist.coverColor || "#ff2e97" }}>
                {isDeleting ? (
                  <div className="selection-indicator">
                    <input
                      type="checkbox"
                      checked={selectedPlaylists.includes(playlist.id)}
                      onChange={() => togglePlaylistSelection(playlist.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <Link href={`/playlists/${playlist.id}`} className="playlist-play-button">
                    {playlist.musicIds.length > 0 ? <Play size={24} /> : <MusicIcon size={24} />}
                  </Link>
                )}
                <div className="playlist-music-count">
                  {playlist.musicIds.length} {playlist.musicIds.length === 1 ? "música" : "músicas"}
                </div>
              </div>
              <div className="playlist-info">
                <Link href={`/playlists/${playlist.id}`} className="playlist-title">
                  {playlist.name}
                </Link>
                {playlist.description && <p className="playlist-description">{playlist.description}</p>}
                <div className="playlist-meta">
                  <span className="playlist-duration">
                    <Clock size={14} className="me-1" />
                    {calculatePlaylistDuration(playlist)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDeleting && selectedPlaylists.length > 0 && (
        <div className="delete-bar">
          <span>{selectedPlaylists.length} playlist(s) selecionada(s)</span>
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            Excluir selecionados
          </button>
        </div>
      )}

      {currentMusic && <MusicPlayer music={currentMusic} musics={musics} onChangeMusic={setCurrentMusic} />}

      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <MusicIcon size={20} />
          <span>Início</span>
        </Link>
        <Link href="/library" className="nav-item">
          <Library size={20} />
          <span>Biblioteca</span>
        </Link>
        <Link href="/playlists" className="nav-item active">
          <ListMusic size={20} />
          <span>Playlists</span>
        </Link>
      </nav>

      {showCreateModal && (
        <CreatePlaylistModal onClose={() => setShowCreateModal(false)} onSave={handleCreatePlaylist} />
      )}
    </main>
  )
}
