"use client"

import { useEffect, useState } from "react"
import MusicPlayer from "@/components/music-player"
import MusicUpload from "@/components/music-upload"
import MusicList from "@/components/music-list"
import type { Music, Playlist } from "@/lib/types"
import { loadMusics, saveMusic } from "@/lib/music-storage"
import { WifiOff, Library, MusicIcon, ListMusic, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [musics, setMusics] = useState<Music[]>([])
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carregar músicas do armazenamento local
    const loadSavedMusics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const savedMusics = await loadMusics()
        setMusics(savedMusics)
        // Não definir música atual automaticamente para evitar problemas de autoplay
      } catch (error) {
        console.error("Erro ao carregar músicas:", error)
        setError("Ocorreu um erro ao carregar suas músicas. Verifique se seu navegador permite armazenamento local.")
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 800) // Pequeno atraso para mostrar o spinner
      }
    }

    loadSavedMusics()

    // Verificar status de conexão
    const handleOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [])

  const handleMusicUpload = async (file: File) => {
    if (isUploading) return // Evitar uploads simultâneos

    setIsUploading(true)
    setError(null)

    try {
      // Criar URL para o arquivo
      const musicUrl = URL.createObjectURL(file)

      // Obter duração do arquivo de áudio
      const duration = await getAudioDuration(file)

      const newMusic: Music = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        file: file,
        url: musicUrl,
        duration: duration || 0,
      }

      // Salvar no armazenamento local
      await saveMusic(newMusic)

      // Atualizar a lista de músicas apenas após o salvamento bem-sucedido
      setMusics((prev) => [...prev, newMusic])
    } catch (error) {
      console.error("Erro ao carregar música:", error)
      setError(
        "Erro ao carregar música. Verifique se seu navegador suporta armazenamento local ou tente um arquivo menor.",
      )
    } finally {
      setIsUploading(false)
    }
  }

  // Função auxiliar para obter a duração do arquivo de áudio
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.preload = "metadata"

      const objectUrl = URL.createObjectURL(file)

      const onLoaded = () => {
        URL.revokeObjectURL(objectUrl)
        audio.removeEventListener("loadedmetadata", onLoaded)
        audio.removeEventListener("error", onError)
        resolve(audio.duration)
      }

      const onError = () => {
        URL.revokeObjectURL(objectUrl)
        audio.removeEventListener("loadedmetadata", onLoaded)
        audio.removeEventListener("error", onError)
        resolve(0) // Retorna 0 se não conseguir obter a duração
      }

      audio.addEventListener("loadedmetadata", onLoaded)
      audio.addEventListener("error", onError)
      audio.src = objectUrl
    })
  }

  const handleSelectMusic = (music: Music) => {
    setCurrentMusic(music)
  }

  const handlePlaylistCreated = (playlist: Playlist) => {
    // Você pode adicionar lógica aqui se precisar atualizar algo após a criação da playlist
    console.log("Nova playlist criada:", playlist)
  }

  return (
    <main className="container-fluid p-0 music-app">
      {!isOnline && (
        <div className="offline-indicator">
          <span className="offline-dot"></span>
          <WifiOff size={16} />
          <span>Modo Offline</span>
        </div>
      )}

      <div className="row g-0">
        <div className="col-12">
          <header className="app-header text-center py-5">
            <h1 className="app-title">Meu App de Música</h1>
            <p className="app-subtitle">Ouça suas músicas favoritas em qualquer lugar, mesmo offline</p>
          </header>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mx-4">
          <AlertTriangle size={18} className="me-2" />
          {error}
        </div>
      )}

      <div className="row g-0">
        <div className="col-12">
          <MusicUpload onUpload={handleMusicUpload} isUploading={isUploading} />
        </div>
      </div>

      <div className="row g-0">
        <div className="col-12">
          {isLoading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <MusicList musics={musics} currentMusic={currentMusic} onSelectMusic={handleSelectMusic} />
          )}
        </div>
      </div>

      {currentMusic && (
        <div className="row g-0">
          <div className="col-12">
            <MusicPlayer music={currentMusic} musics={musics} onChangeMusic={handleSelectMusic} />
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <Link href="/" className="nav-item active">
          <MusicIcon size={20} />
          <span>Início</span>
        </Link>
        <Link href="/library" className="nav-item">
          <Library size={20} />
          <span>Biblioteca</span>
        </Link>
        <Link href="/playlists" className="nav-item">
          <ListMusic size={20} />
          <span>Playlists</span>
        </Link>
      </nav>
    </main>
  )
}
