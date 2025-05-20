import type { Playlist } from "./types"

// Chave para armazenar playlists no IndexedDB
const PLAYLIST_STORE_NAME = "playlists"
const DB_NAME = "music-app-db"
const DB_VERSION = 1 // Voltamos para versão 1 para evitar conflitos

// Função para abrir o banco de dados
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Seu navegador não suporta IndexedDB"))
      return
    }

    // Primeiro, verificamos a versão atual do banco
    const checkRequest = indexedDB.open(DB_NAME)

    checkRequest.onsuccess = () => {
      const db = checkRequest.result
      const currentVersion = db.version
      db.close()

      // Agora abrimos com a versão correta
      const request = indexedDB.open(DB_NAME, currentVersion)

      request.onerror = (event) => {
        console.error("Erro ao abrir o banco de dados:", event)
        reject(new Error("Erro ao abrir o banco de dados"))
      }

      request.onsuccess = () => {
        const db = request.result

        // Verificamos se o store de playlists existe
        if (!db.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
          db.close()
          // Se não existe, incrementamos a versão e reabrimos
          const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1)

          upgradeRequest.onupgradeneeded = (event) => {
            const db = upgradeRequest.result
            if (!db.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
              db.createObjectStore(PLAYLIST_STORE_NAME, { keyPath: "id" })
              console.log("Store de playlists criado com sucesso")
            }
          }

          upgradeRequest.onsuccess = () => {
            resolve(upgradeRequest.result)
          }

          upgradeRequest.onerror = (event) => {
            console.error("Erro ao atualizar o banco de dados:", event)
            reject(new Error("Erro ao atualizar o banco de dados"))
          }
        } else {
          resolve(db)
        }
      }

      request.onupgradeneeded = (event) => {
        const db = request.result
        if (!db.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
          db.createObjectStore(PLAYLIST_STORE_NAME, { keyPath: "id" })
          console.log("Store de playlists criado durante upgrade")
        }
      }
    }

    checkRequest.onerror = (event) => {
      console.error("Erro ao verificar versão do banco de dados:", event)
      reject(new Error("Erro ao verificar versão do banco de dados"))
    }
  })
}

// Função para salvar uma playlist no IndexedDB
export const savePlaylist = async (playlist: Playlist): Promise<void> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], "readwrite")
        const store = transaction.objectStore(PLAYLIST_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação:", event)
          reject(new Error("Erro na transação do banco de dados"))
        }

        transaction.oncomplete = () => {
          db.close()
          resolve()
        }

        store.put(playlist)
      } catch (error) {
        console.error("Erro ao executar transação:", error)
        db.close()
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao salvar playlist:", error)
    throw error
  }
}

// Função para carregar todas as playlists do IndexedDB
export const loadPlaylists = async (): Promise<Playlist[]> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], "readonly")
        const store = transaction.objectStore(PLAYLIST_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação de leitura:", event)
          reject(new Error("Erro na transação de leitura"))
        }

        const request = store.getAll()

        request.onerror = (event) => {
          console.error("Erro ao ler playlists:", event)
          reject(new Error("Erro ao ler playlists"))
        }

        request.onsuccess = () => {
          db.close()
          resolve(request.result || [])
        }
      } catch (error) {
        console.error("Erro ao executar transação de leitura:", error)
        db.close()
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao carregar playlists:", error)
    // Retornar array vazio em caso de erro para evitar quebrar a aplicação
    return []
  }
}

// Função para carregar uma playlist específica pelo ID
export const loadPlaylistById = async (id: string): Promise<Playlist | null> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], "readonly")
        const store = transaction.objectStore(PLAYLIST_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação de leitura:", event)
          reject(new Error("Erro na transação de leitura"))
        }

        const request = store.get(id)

        request.onerror = (event) => {
          console.error("Erro ao ler playlist:", event)
          reject(new Error("Erro ao ler playlist"))
        }

        request.onsuccess = () => {
          db.close()
          resolve(request.result || null)
        }
      } catch (error) {
        console.error("Erro ao executar transação de leitura:", error)
        db.close()
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao carregar playlist:", error)
    return null
  }
}

// Função para remover uma playlist do IndexedDB
export const removePlaylist = async (id: string): Promise<void> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], "readwrite")
        const store = transaction.objectStore(PLAYLIST_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação de remoção:", event)
          reject(new Error("Erro na transação de remoção"))
        }

        transaction.oncomplete = () => {
          db.close()
          resolve()
        }

        store.delete(id)
      } catch (error) {
        console.error("Erro ao executar delete:", error)
        db.close()
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao remover playlist:", error)
    throw error
  }
}

// Função para adicionar uma música a uma playlist
export const addMusicToPlaylist = async (playlistId: string, musicId: string): Promise<void> => {
  try {
    const playlist = await loadPlaylistById(playlistId)

    if (!playlist) {
      throw new Error("Playlist não encontrada")
    }

    // Verificar se a música já está na playlist
    if (!playlist.musicIds.includes(musicId)) {
      playlist.musicIds.push(musicId)
      playlist.updatedAt = Date.now()
      await savePlaylist(playlist)
    }
  } catch (error) {
    console.error("Erro ao adicionar música à playlist:", error)
    throw error
  }
}

// Função para remover uma música de uma playlist
export const removeMusicFromPlaylist = async (playlistId: string, musicId: string): Promise<void> => {
  try {
    const playlist = await loadPlaylistById(playlistId)

    if (!playlist) {
      throw new Error("Playlist não encontrada")
    }

    playlist.musicIds = playlist.musicIds.filter((id) => id !== musicId)
    playlist.updatedAt = Date.now()
    await savePlaylist(playlist)
  } catch (error) {
    console.error("Erro ao remover música da playlist:", error)
    throw error
  }
}

// Função para gerar uma cor aleatória para a capa da playlist
export const generateRandomColor = (): string => {
  const colors = [
    "#ff2e97", // rosa
    "#00e1ff", // ciano
    "#7c4dff", // roxo
    "#ff9e58", // laranja
    "#00b8cc", // azul
    "#d6008b", // rosa escuro
    "#6536e6", // roxo escuro
    "#ff6eb5", // rosa claro
    "#7df9ff", // ciano claro
    "#9e7bff", // roxo claro
  ]

  return colors[Math.floor(Math.random() * colors.length)]
}
