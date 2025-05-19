"use client"

import { useEffect, useState } from "react"
import { loadMusics, removeMusic } from "@/lib/music-storage"
import type { Music } from "@/lib/types"
import { Library, Grid, List, MusicIcon, Trash2, Play, Pause, SortAsc, SortDesc, Search } from "lucide-react"
import Link from "next/link"
import MusicPlayer from "@/components/music-player"

export default function LibraryPage() {
  const [musics, setMusics] = useState<Music[]>([])
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"name" | "date">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedMusics, setSelectedMusics] = useState<string[]>([])

  useEffect(() => {
    const loadUserMusics = async () => {
      setIsLoading(true)
      try {
        const savedMusics = await loadMusics()
        setMusics(savedMusics)
      } catch (error) {
        console.error("Erro ao carregar músicas:", error)
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 800)
      }
    }

    loadUserMusics()
  }, [])

  const handleSelectMusic = (music: Music) => {
    if (isDeleting) {
      toggleMusicSelection(music.id)
    } else {
      setCurrentMusic(music)
    }
  }

  const toggleMusicSelection = (id: string) => {
    setSelectedMusics((prev) => (prev.includes(id) ? prev.filter((musicId) => musicId !== id) : [...prev, id]))
  }

  const handleDeleteSelected = async () => {
    if (selectedMusics.length === 0) return

    const confirmed = window.confirm(`Tem certeza que deseja excluir ${selectedMusics.length} música(s)?`)

    if (confirmed) {
      try {
        for (const id of selectedMusics) {
          await removeMusic(id)

          // Se a música atual for excluída, limpe o player
          if (currentMusic && id === currentMusic.id) {
            setCurrentMusic(null)
          }
        }

        // Atualizar a lista de músicas
        const updatedMusics = musics.filter((music) => !selectedMusics.includes(music.id))
        setMusics(updatedMusics)
        setSelectedMusics([])
        setIsDeleting(false)
      } catch (error) {
        console.error("Erro ao excluir músicas:", error)
        alert("Erro ao excluir músicas. Tente novamente.")
      }
    }
  }

  const toggleDeleteMode = () => {
    setIsDeleting(!isDeleting)
    if (isDeleting) {
      setSelectedMusics([])
    }
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }

  const changeSortBy = (sort: "name" | "date") => {
    if (sortBy === sort) {
      toggleSortOrder()
    } else {
      setSortBy(sort)
      setSortOrder("asc")
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  // Filtrar e ordenar músicas
  const filteredAndSortedMusics = musics
    .filter(
      (music) =>
        searchTerm === "" ||
        music.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (music.artist && music.artist.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else {
        // Ordenar por ID (que é baseado em timestamp)
        return sortOrder === "asc"
          ? Number.parseInt(a.id) - Number.parseInt(b.id)
          : Number.parseInt(b.id) - Number.parseInt(a.id)
      }
    })

  return (
    <main className="container-fluid p-0 music-app">
      <div className="row g-0">
        <div className="col-12">
          <header className="library-header">
            <div className="d-flex align-items-center">
              <Library size={24} className="me-2" />
              <h1 className="library-title">Minha Biblioteca</h1>
            </div>
            <div className="library-actions">
              <button
                className={`btn-icon ${isDeleting ? "btn-danger" : ""}`}
                onClick={toggleDeleteMode}
                title={isDeleting ? "Cancelar exclusão" : "Excluir músicas"}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </header>
        </div>
      </div>

      <div className="row g-0">
        <div className="col-12">
          <div className="library-toolbar">
            <div className="search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar na biblioteca..."
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

            <div className="view-options">
              <button
                className={`view-option ${sortBy === "name" ? "active" : ""}`}
                onClick={() => changeSortBy("name")}
                title="Ordenar por nome"
              >
                <SortAsc size={18} />
                <span className="option-text">Nome</span>
              </button>
              <button
                className={`view-option ${sortBy === "date" ? "active" : ""}`}
                onClick={() => changeSortBy("date")}
                title="Ordenar por data"
              >
                <SortDesc size={18} />
                <span className="option-text">Data</span>
              </button>
              <button
                className={`view-option ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Visualização em grade"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-option ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="Visualização em lista"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : filteredAndSortedMusics.length === 0 ? (
        <div className="empty-library">
          <div className="empty-icon">
            <MusicIcon size={40} />
          </div>
          <h3>Sua biblioteca está vazia</h3>
          <p>
            Adicione músicas na página inicial para começar a ouvir.
            {searchTerm && " Ou tente uma busca diferente."}
          </p>
          <Link href="/" className="btn btn-primary mt-3">
            Adicionar músicas
          </Link>
        </div>
      ) : (
        <div className={`library-content ${viewMode}`}>
          {viewMode === "grid" ? (
            <div className="music-grid">
              {filteredAndSortedMusics.map((music, index) => (
                <div
                  key={music.id}
                  className={`music-card ${currentMusic?.id === music.id ? "active" : ""} ${
                    selectedMusics.includes(music.id) ? "selected" : ""
                  }`}
                  onClick={() => handleSelectMusic(music)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="music-thumbnail">
                    <div className="thumbnail-placeholder">
                      <MusicIcon size={32} />
                    </div>
                    <div className="music-actions">
                      {isDeleting ? (
                        <div className="selection-indicator">
                          <input
                            type="checkbox"
                            checked={selectedMusics.includes(music.id)}
                            onChange={() => toggleMusicSelection(music.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <button className="play-button">
                          {currentMusic?.id === music.id ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="music-info">
                    <h3 className="music-title">{music.name}</h3>
                    <p className="music-artist">{music.artist || "Arquivo local"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="music-list-view">
              <div className="list-header">
                <div className="list-cell cell-icon"></div>
                <div className="list-cell cell-title">Título</div>
                <div className="list-cell cell-artist">Artista</div>
                <div className="list-cell cell-duration">Duração</div>
              </div>
              {filteredAndSortedMusics.map((music) => (
                <div
                  key={music.id}
                  className={`list-row ${currentMusic?.id === music.id ? "active" : ""} ${selectedMusics.includes(music.id) ? "selected" : ""}`}
                  onClick={() => handleSelectMusic(music)}
                >
                  <div className="list-cell cell-icon">
                    {isDeleting ? (
                      <input
                        type="checkbox"
                        checked={selectedMusics.includes(music.id)}
                        onChange={() => toggleMusicSelection(music.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : currentMusic?.id === music.id ? (
                      <div className="playing-icon">
                        <div className="playing-bar"></div>
                        <div className="playing-bar"></div>
                        <div className="playing-bar"></div>
                      </div>
                    ) : (
                      <MusicIcon size={18} />
                    )}
                  </div>
                  <div className="list-cell cell-title">{music.name}</div>
                  <div className="list-cell cell-artist">{music.artist || "Arquivo local"}</div>
                  <div className="list-cell cell-duration">{formatDuration(music.duration)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isDeleting && selectedMusics.length > 0 && (
        <div className="delete-bar">
          <span>{selectedMusics.length} música(s) selecionada(s)</span>
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            Excluir selecionados
          </button>
        </div>
      )}

      {currentMusic && <MusicPlayer music={currentMusic} />}

      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <MusicIcon size={20} />
          <span>Início</span>
        </Link>
        <Link href="/library" className="nav-item active">
          <Library size={20} />
          <span>Biblioteca</span>
        </Link>
      </nav>
    </main>
  )
}
