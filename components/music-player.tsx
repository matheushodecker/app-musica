"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import type { Music } from "@/lib/types"

interface MusicPlayerProps {
  music: Music
}

export default function MusicPlayer({ music }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visualizerValues, setVisualizerValues] = useState<number[]>(Array(20).fill(5))

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Inicializar o áudio quando o componente montar ou a música mudar
  useEffect(() => {
    const audio = new Audio(music.url)
    audioRef.current = audio

    // Configurar eventos do áudio
    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("loadedmetadata", onAudioLoaded)
    audio.addEventListener("ended", onAudioEnded)
    audio.addEventListener("error", onAudioError)

    // Aplicar volume
    audio.volume = volume

    // Limpar quando o componente desmontar
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      audio.pause()
      audio.removeEventListener("timeupdate", updateProgress)
      audio.removeEventListener("loadedmetadata", onAudioLoaded)
      audio.removeEventListener("ended", onAudioEnded)
      audio.removeEventListener("error", onAudioError)
      URL.revokeObjectURL(music.url)
    }
  }, [music])

  // Atualizar o estado de reprodução
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Erro ao reproduzir áudio:", error)
            setError("Não foi possível reproduzir este áudio. Tente novamente.")
            setIsPlaying(false)
          })
        }
        animateVisualizer()
      } else {
        audioRef.current.pause()
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [isPlaying])

  // Atualizar o volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const onAudioLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setError(null)
    }
  }

  const onAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const onAudioError = () => {
    setError("Erro ao carregar o áudio. O formato pode não ser suportado.")
    setIsPlaying(false)
  }

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const animateVisualizer = () => {
    // Gerar valores aleatórios para o visualizador quando a música estiver tocando
    if (isPlaying) {
      const newValues = visualizerValues.map(() => Math.max(5, Math.floor(Math.random() * 35)))
      setVisualizerValues(newValues)
      animationFrameRef.current = requestAnimationFrame(animateVisualizer)
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      const newTime = percent * duration

      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  return (
    <div className="music-player">
      <div className="music-info">
        <div className="music-thumbnail">
          <div className="thumbnail-placeholder">
            <div className="playing-icon">
              {isPlaying && (
                <>
                  <div className="playing-bar"></div>
                  <div className="playing-bar"></div>
                  <div className="playing-bar"></div>
                  <div className="playing-bar"></div>
                  <div className="playing-bar"></div>
                </>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="fw-bold">{music.name}</div>
          <div className="text-muted">{music.artist || "Arquivo local"}</div>
        </div>
      </div>

      {error ? (
        <div className="playback-error">
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="player-progress" ref={progressBarRef} onClick={handleProgressClick}>
            <div className="progress-bar" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
          </div>

          <div className="time-display d-none d-md-block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </>
      )}

      <div className="player-controls">
        <button className="player-button" disabled={!!error}>
          <SkipBack size={20} />
        </button>
        <button className="player-button play-pause" onClick={handlePlayPause} disabled={!!error}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button className="player-button" disabled={!!error}>
          <SkipForward size={20} />
        </button>
        <button className="player-button d-none d-md-flex volume-control" onClick={handleVolumeToggle}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="audio-visualizer">
        {visualizerValues.map((value, index) => (
          <div
            key={index}
            className="visualizer-bar"
            style={{
              height: `${isPlaying ? value : 5}px`,
              opacity: isPlaying ? 1 : 0.3,
              transition: `height ${isPlaying ? "0.1s" : "0.5s"} ease`,
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}
