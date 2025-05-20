"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from "lucide-react"
import type { Music } from "@/lib/types"

interface MusicPlayerProps {
  music: Music
  musics: Music[]
  onChangeMusic: (music: Music) => void
}

export default function MusicPlayer({ music, musics, onChangeMusic }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visualizerValues, setVisualizerValues] = useState<number[]>(Array(20).fill(5))
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Inicializar o áudio quando o componente montar ou a música mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeEventListener("timeupdate", updateProgress)
      audioRef.current.removeEventListener("loadedmetadata", onAudioLoaded)
      audioRef.current.removeEventListener("ended", onAudioEnded)
      audioRef.current.removeEventListener("error", onAudioError)
    }

    const audio = new Audio(music.url)
    audioRef.current = audio

    // Configurar eventos do áudio
    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("loadedmetadata", onAudioLoaded)
    audio.addEventListener("ended", onAudioEnded)
    audio.addEventListener("error", onAudioError)

    // Aplicar volume
    audio.volume = isMuted ? 0 : volume

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

      // Iniciar reprodução automaticamente quando uma nova música é carregada
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Erro ao reproduzir automaticamente:", error)
        })
      }
    }
  }

  const onAudioEnded = () => {
    if (isRepeat) {
      // Repetir a música atual
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((error) => {
          console.error("Erro ao repetir música:", error)
        })
      }
    } else {
      // Avançar para a próxima música
      playNextMusic()
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

  // Encontrar o índice da música atual na lista
  const getCurrentMusicIndex = (): number => {
    return musics.findIndex((m) => m.id === music.id)
  }

  // Reproduzir a próxima música
  const playNextMusic = () => {
    const currentIndex = getCurrentMusicIndex()

    if (currentIndex === -1 || musics.length <= 1) return

    let nextIndex: number

    if (isShuffle) {
      // Modo aleatório: escolher uma música aleatória diferente da atual
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * musics.length)
      } while (randomIndex === currentIndex && musics.length > 1)
      nextIndex = randomIndex
    } else {
      // Modo sequencial: próxima música ou voltar para a primeira
      nextIndex = (currentIndex + 1) % musics.length
    }

    onChangeMusic(musics[nextIndex])
    setIsPlaying(true)
  }

  // Reproduzir a música anterior
  const playPreviousMusic = () => {
    const currentIndex = getCurrentMusicIndex()

    if (currentIndex === -1 || musics.length <= 1) return

    let prevIndex: number

    if (isShuffle) {
      // Modo aleatório: escolher uma música aleatória diferente da atual
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * musics.length)
      } while (randomIndex === currentIndex && musics.length > 1)
      prevIndex = randomIndex
    } else {
      // Modo sequencial: música anterior ou ir para a última
      prevIndex = (currentIndex - 1 + musics.length) % musics.length
    }

    onChangeMusic(musics[prevIndex])
    setIsPlaying(true)
  }

  // Alternar modo de repetição
  const toggleRepeat = () => {
    setIsRepeat(!isRepeat)
  }

  // Alternar modo aleatório
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle)
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
        <button
          className={`player-button ${musics.length <= 1 ? "disabled" : ""}`}
          onClick={playPreviousMusic}
          disabled={!!error || musics.length <= 1}
          title="Música anterior"
        >
          <SkipBack size={20} />
        </button>

        <button
          className="player-button play-pause"
          onClick={handlePlayPause}
          disabled={!!error}
          title={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <button
          className={`player-button ${musics.length <= 1 ? "disabled" : ""}`}
          onClick={playNextMusic}
          disabled={!!error || musics.length <= 1}
          title="Próxima música"
        >
          <SkipForward size={20} />
        </button>

        <button
          className={`player-button d-none d-md-flex ${isRepeat ? "active" : ""}`}
          onClick={toggleRepeat}
          title={isRepeat ? "Desativar repetição" : "Repetir música"}
        >
          <Repeat size={20} />
        </button>

        <button
          className={`player-button d-none d-md-flex ${isShuffle ? "active" : ""}`}
          onClick={toggleShuffle}
          disabled={musics.length <= 1}
          title={isShuffle ? "Desativar modo aleatório" : "Modo aleatório"}
        >
          <Shuffle size={20} />
        </button>

        <button
          className="player-button d-none d-md-flex volume-control"
          onClick={handleVolumeToggle}
          title={isMuted ? "Ativar som" : "Silenciar"}
        >
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
