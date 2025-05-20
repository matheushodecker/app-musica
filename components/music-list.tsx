"use client"

import { useState } from "react"
import { MusicIcon, Play, Pause, MoreVertical, PlusCircle } from "lucide-react"
import type { Music } from "@/lib/types"
import AddToPlaylistModal from "@/components/add-to-playlist-modal"

interface MusicListProps {
  musics: Music[]
  currentMusic: Music | null
  onSelectMusic: (music: Music) => void
}

export default function MusicList({ musics, currentMusic, onSelectMusic }: MusicListProps) {
  const [musicMenuOpen, setMusicMenuOpen] = useState<string | null>(null)
  const [selectedMusicForPlaylist, setSelectedMusicForPlaylist] = useState<string | null>(null)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)

  const handleAddToPlaylist = (musicId: string) => {
    setSelectedMusicForPlaylist(musicId)
    setShowAddToPlaylistModal(true)
    setMusicMenuOpen(null)
  }

  if (musics.length === 0) {
    return (
      <div className="empty-list">
        <div className="empty-icon">
          <MusicIcon size={40} />
        </div>
        <h3>Nenhuma música encontrada</h3>
        <p>
          Adicione músicas usando o botão de upload acima para começar a ouvir. Você pode adicionar arquivos MP3, WAV,
          OGG e outros formatos de áudio suportados.
        </p>
      </div>
    )
  }

  return (
    <div className="music-list">
      <h2>Suas Músicas</h2>
      <div className="row">
        {musics.map((music, index) => (
          <div className="col-12" key={music.id}>
            <div
              className={`music-card d-flex align-items-center ${currentMusic?.id === music.id ? "active" : ""}`}
              onClick={() => onSelectMusic(music)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="music-icon me-3">
                {currentMusic?.id === music.id ? (
                  <div className="playing-icon">
                    <div className="playing-bar"></div>
                    <div className="playing-bar"></div>
                    <div className="playing-bar"></div>
                    <div className="playing-bar"></div>
                    <div className="playing-bar"></div>
                  </div>
                ) : (
                  <MusicIcon size={24} />
                )}
              </div>
              <div className="flex-grow-1">
                <h3 className="music-title mb-1">{music.name}</h3>
                <p className="music-artist mb-0">{music.artist || "Arquivo local"}</p>
              </div>
              <div className="d-flex align-items-center">
                <button className="play-button btn-icon me-2">
                  {currentMusic?.id === music.id ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <div className="music-menu-container">
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMusicMenuOpen(musicMenuOpen === music.id ? null : music.id)
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {musicMenuOpen === music.id && (
                    <div className="music-menu">
                      <button
                        className="music-menu-item"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToPlaylist(music.id)
                        }}
                      >
                        <PlusCircle size={16} className="me-2" />
                        Adicionar à playlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddToPlaylistModal && selectedMusicForPlaylist && (
        <AddToPlaylistModal
          musicId={selectedMusicForPlaylist}
          onClose={() => setShowAddToPlaylistModal(false)}
          onPlaylistCreated={(playlist) => {
            console.log("Nova playlist criada:", playlist)
            setShowAddToPlaylistModal(false)
          }}
        />
      )}
    </div>
  )
}
