import type { Music, StoredMusic, StoredMusicFile } from "./types"

// Chave para armazenar músicas no IndexedDB
const MUSIC_STORE_NAME = "musics"
const DB_NAME = "music-app-db"
const DB_VERSION = 1

// Função para abrir o banco de dados
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("Erro ao abrir o banco de dados:", event)
      reject(new Error("Erro ao abrir o banco de dados"))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
        db.createObjectStore(MUSIC_STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

// Função para salvar uma música no IndexedDB
export const saveMusic = async (music: Music): Promise<void> => {
  try {
    // Primeiro, vamos preparar todos os dados necessários antes de iniciar a transação
    const fileArrayBuffer = await music.file.arrayBuffer()

    const fileData: StoredMusicFile = {
      name: music.file.name,
      type: music.file.type,
      size: music.file.size,
      lastModified: music.file.lastModified,
      data: fileArrayBuffer,
    }

    const musicToStore: StoredMusic = {
      id: music.id,
      name: music.name,
      artist: music.artist,
      url: music.url,
      duration: music.duration,
      file: fileData,
    }

    // Agora que temos todos os dados, vamos abrir o banco e iniciar a transação
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      // Criar uma nova transação para cada operação
      const transaction = db.transaction([MUSIC_STORE_NAME], "readwrite")
      const store = transaction.objectStore(MUSIC_STORE_NAME)

      transaction.onerror = (event) => {
        console.error("Erro na transação:", event)
        reject(new Error("Erro na transação do banco de dados"))
      }

      transaction.oncomplete = () => {
        resolve()
      }

      // Executar a operação de salvamento
      try {
        store.put(musicToStore)
      } catch (error) {
        console.error("Erro ao executar put:", error)
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao preparar música para salvar:", error)
    throw error
  }
}

// Função para carregar todas as músicas do IndexedDB
export const loadMusics = async (): Promise<Music[]> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STORE_NAME], "readonly")
      const store = transaction.objectStore(MUSIC_STORE_NAME)

      transaction.onerror = (event) => {
        console.error("Erro na transação de leitura:", event)
        reject(new Error("Erro na transação de leitura"))
      }

      const request = store.getAll()

      request.onerror = (event) => {
        console.error("Erro ao ler músicas:", event)
        reject(new Error("Erro ao ler músicas"))
      }

      request.onsuccess = () => {
        try {
          // Converter os dados armazenados de volta para o formato Music
          const musics: Music[] = request.result.map((storedMusic: StoredMusic) => {
            const fileData = storedMusic.file

            // Criar um novo File a partir do ArrayBuffer
            const file = new File([fileData.data], fileData.name, {
              type: fileData.type,
              lastModified: fileData.lastModified,
            })

            // Criar uma URL para o arquivo
            const url = URL.createObjectURL(file)

            return {
              id: storedMusic.id,
              name: storedMusic.name,
              artist: storedMusic.artist,
              duration: storedMusic.duration,
              file,
              url,
            }
          })

          resolve(musics)
        } catch (error) {
          console.error("Erro ao processar músicas:", error)
          reject(new Error("Erro ao processar músicas"))
        }
      }
    })
  } catch (error) {
    console.error("Erro ao carregar músicas:", error)
    throw error
  }
}

// Função para remover uma música do IndexedDB
export const removeMusic = async (id: string): Promise<void> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MUSIC_STORE_NAME], "readwrite")
      const store = transaction.objectStore(MUSIC_STORE_NAME)

      transaction.onerror = (event) => {
        console.error("Erro na transação de remoção:", event)
        reject(new Error("Erro na transação de remoção"))
      }

      transaction.oncomplete = () => {
        resolve()
      }

      try {
        store.delete(id)
      } catch (error) {
        console.error("Erro ao executar delete:", error)
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao remover música:", error)
    throw error
  }
}
