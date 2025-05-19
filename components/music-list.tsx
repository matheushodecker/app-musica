"use client"

import { MusicIcon, Play, Pause } from "lucide-react"
import type { Music } from "@/lib/types"

interface MusicListProps {
  musics: Music[]
  currentMusic: Music | null
  onSelectMusic: (music: Music) => void
}

export default function MusicList({ musics, currentMusic, onSelectMusic }: MusicListProps) {
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
              <button className="play-button btn-icon">
                {currentMusic?.id === music.id ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
