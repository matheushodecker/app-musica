"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { loadPlaylistById, removeMusicFromPlaylist, removePlaylist } from "@/lib/playlist-storage"
import { loadMusics } from "@/lib/music-storage"
import type { Playlist, Music } from "@/lib/types"
import {
  Library,
  MusicIcon,
  ListMusic,
  Play,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
  PlusCircle,
} from "lucide-react"
import Link from "next/link"
import MusicPlayer from "@/components/music-player"
import EditPlaylistModal from "@/components/edit-playlist-modal"
import AddMusicToPlaylistModal from "@/components/add-music-to-playlist-modal"

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistMusics, setPlaylistMusics] = useState<Music[]>([])
  const [allMusics, setAllMusics] = useState<Music[]>([])
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddMusicModal, setShowAddMusicModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const id = Array.isArray(params.id) ? params.id[0] : params.id

        // Carregamos as músicas primeiro
        const savedMusics = await loadMusics()
        setAllMusics(savedMusics)

        // Depois tentamos carregar a playlist
        try {
          const loadedPlaylist = await loadPlaylistById(id)

          if (!loadedPlaylist) {
            setError("Playlist não encontrada")
            setIsLoading(false)
            return
          }

          setPlaylist(loadedPlaylist)

          // Filtrar músicas que pertencem à playlist
          const musicsInPlaylist = savedMusics.filter((music) => loadedPlaylist.musicIds.includes(music.id))
          setPlaylistMusics(musicsInPlaylist)
        } catch (playlistError) {
          console.error("Erro ao carregar playlist:", playlistError)
          setError("Não foi possível carregar a playlist. Tente novamente mais tarde.")
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
  }, [params.id, router])

  const handleSelectMusic = (music: Music) => {
    setCurrentMusic(music)
  }

  const handlePlayAll = () => {
    if (playlistMusics.length > 0) {
      setCurrentMusic(playlistMusics[0])
    }
  }

  const handleRemoveMusicFromPlaylist = async (musicId: string) => {
    if (!playlist) return

    const confirmed = window.confirm("Remover esta música da playlist?")
    if (!confirmed) return

    try {
      await removeMusicFromPlaylist(playlist.id, musicId)

      // Atualizar a lista de músicas da playlist
      setPlaylistMusics((prev) => prev.filter((music) => music.id !== musicId))

      // Atualizar o objeto da playlist
      setPlaylist((prev) => {
        if (!prev) return null
        return {
          ...prev,
          musicIds: prev.musicIds.filter((id) => id !== musicId),
          updatedAt: Date.now(),
        }
      })

      // Se a música atual for removida, limpe o player
      if (currentMusic && currentMusic.id === musicId) {
        setCurrentMusic(null)
      }
    } catch (error) {
      console.error("Erro ao remover música da playlist:", error)
      alert("Erro ao remover música. Tente novamente.")
    }
  }

  const handleDeletePlaylist = async () => {
    if (!playlist) return

    const confirmed = window.confirm(`Tem certeza que deseja excluir a playlist "${playlist.name}"?`)
    if (!confirmed) return

    try {
      await removePlaylist(playlist.id)
      router.push("/playlists")
    } catch (error) {
      console.error("Erro ao excluir playlist:", error)
      alert("Erro ao excluir playlist. Tente novamente.")
    }
  }

  const handleUpdatePlaylist = (updatedPlaylist: Playlist) => {
    setPlaylist(updatedPlaylist)
    setShowEditModal(false)
  }

  const handleMusicAdded = (updatedPlaylist: Playlist) => {
    setPlaylist(updatedPlaylist)

    // Atualizar a lista de músicas da playlist
    const updatedMusics = allMusics.filter((music) => updatedPlaylist.musicIds.includes(music.id))
    setPlaylistMusics(updatedMusics)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Calcular duração total da playlist
  const calculateTotalDuration = () => {
    const totalSeconds = playlistMusics.reduce((total, music) => total + music.duration, 0)

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    if (hours > 0) {
      return `${hours} h ${minutes} min`
    }
    return `${minutes} min`
  }

  if (isLoading) {
    return (
      <main className="container-fluid p-0 music-app">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-fluid p-0 music-app">
        <div className="row g-0">
          <div className="col-12">
            <header className="library-header">
              <div className="d-flex align-items-center">
                <button className="btn-icon back-button me-2" onClick={() => router.push("/playlists")}>
                  <ArrowLeft size={20} />
                </button>
                <h1 className="library-title">Detalhes da Playlist</h1>
              </div>
            </header>
          </div>
        </div>

        <div className="alert alert-danger mx-4 mt-4">
          <AlertTriangle size={18} className="me-2" />
          {error}
        </div>

        <div className="empty-library">
          <div className="empty-icon">
            <ListMusic size={40} />
          </div>
          <h3>Não foi possível carregar a playlist</h3>
          <Link href="/playlists" className="btn btn-primary mt-3">
            Voltar para Playlists
          </Link>
        </div>
      </main>
    )
  }

  if (!playlist) {
    return (
      <main className="container-fluid p-0 music-app">
        <div className="empty-library">
          <div className="empty-icon">
            <ListMusic size={40} />
          </div>
          <h3>Playlist não encontrada</h3>
          <Link href="/playlists" className="btn btn-primary mt-3">
            Voltar para Playlists
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container-fluid p-0 music-app">
      <div className="row g-0">
        <div className="col-12">
          <header className="playlist-header" style={{ backgroundColor: playlist.coverColor || "#ff2e97" }}>
            <div className="playlist-header-content">
              <div className="d-flex align-items-center">
                <button className="btn-icon back-button" onClick={() => router.push("/playlists")}>
                  <ArrowLeft size={20} />
                </button>
                <h1 className="playlist-header-title">{playlist.name}</h1>
              </div>

              <div className="playlist-header-actions">
                <button className="btn btn-add-music" onClick={() => setShowAddMusicModal(true)}>
                  <PlusCircle size={20} className="me-2" />
                  Adicionar Músicas
                </button>

                {playlistMusics.length > 0 && (
                  <button className="btn btn-play-all" onClick={handlePlayAll}>
                    <Play size={20} className="me-2" />
                    Reproduzir
                  </button>
                )}

                <div className="playlist-menu-container">
                  <button className="btn-icon" onClick={() => setShowMenu(!showMenu)}>
                    <MoreVertical size={20} />
                  </button>

                  {showMenu && (
                    <div className="playlist-menu">
                      <button
                        className="playlist-menu-item"
                        onClick={() => {
                          setShowMenu(false)
                          setShowEditModal(true)
                        }}
                      >
                        <Edit size={16} className="me-2" />
                        Editar playlist
                      </button>
                      <button
                        className="playlist-menu-item text-danger"
                        onClick={() => {
                          setShowMenu(false)
                          handleDeletePlaylist()
                        }}
                      >
                        <Trash2 size={16} className="me-2" />
                        Excluir playlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="playlist-header-info">
              {playlist.description && <p className="playlist-description">{playlist.description}</p>}
              <div className="playlist-stats">
                <span>
                  {playlistMusics.length} {playlistMusics.length === 1 ? "música" : "músicas"}
                </span>
                <span className="mx-2">•</span>
                <span>{calculateTotalDuration()}</span>
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="playlist-content">
        {playlistMusics.length === 0 ? (
          <div className="empty-playlist">
            <div className="empty-icon">
              <MusicIcon size={40} />
            </div>
            <h3>Playlist vazia</h3>
            <p>Adicione músicas à sua playlist para começar a ouvir.</p>
            <button className="btn btn-primary mt-3" onClick={() => setShowAddMusicModal(true)}>
              Adicionar Músicas
            </button>
          </div>
        ) : (
          <div className="music-list-view">
            <div className="list-header">
              <div className="list-cell cell-number">#</div>
              <div className="list-cell cell-title">Título</div>
              <div className="list-cell cell-artist">Artista</div>
              <div className="list-cell cell-duration">
                <Clock size={16} />
              </div>
              <div className="list-cell cell-actions"></div>
            </div>

            {playlistMusics.map((music, index) => (
              <div
                key={music.id}
                className={`list-row ${currentMusic?.id === music.id ? "active" : ""}`}
                onClick={() => handleSelectMusic(music)}
              >
                <div className="list-cell cell-number">
                  {currentMusic?.id === music.id ? (
                    <div className="playing-icon">
                      <div className="playing-bar"></div>
                      <div className="playing-bar"></div>
                      <div className="playing-bar"></div>
                    </div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="list-cell cell-title">{music.name}</div>
                <div className="list-cell cell-artist">{music.artist || "Arquivo local"}</div>
                <div className="list-cell cell-duration">{formatDuration(music.duration)}</div>
                <div className="list-cell cell-actions">
                  <button
                    className="btn-icon btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveMusicFromPlaylist(music.id)
                    }}
                    title="Remover da playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentMusic && <MusicPlayer music={currentMusic} musics={playlistMusics} onChangeMusic={handleSelectMusic} />}

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

      {showEditModal && (
        <EditPlaylistModal playlist={playlist} onClose={() => setShowEditModal(false)} onSave={handleUpdatePlaylist} />
      )}

      {showAddMusicModal && playlist && (
        <AddMusicToPlaylistModal
          playlist={playlist}
          onClose={() => setShowAddMusicModal(false)}
          onMusicAdded={handleMusicAdded}
        />
      )}
    </main>
  )
}
