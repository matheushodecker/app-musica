import type { Music, StoredMusic, StoredMusicFile } from "./types"

// Chave para armazenar músicas no IndexedDB
const MUSIC_STORE_NAME = "musics"
const DB_NAME = "music-app-db"
const DB_VERSION = 1 // Mantemos a versão 1 como base

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

        // Verificamos se o store de músicas existe
        if (!db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
          db.close()
          // Se não existe, incrementamos a versão e reabrimos
          const upgradeRequest = indexedDB.open(DB_NAME, currentVersion + 1)

          upgradeRequest.onupgradeneeded = (event) => {
            const db = upgradeRequest.result
            if (!db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
              db.createObjectStore(MUSIC_STORE_NAME, { keyPath: "id" })
              console.log("Store de músicas criado com sucesso")
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
        if (!db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
          db.createObjectStore(MUSIC_STORE_NAME, { keyPath: "id" })
          console.log("Store de músicas criado durante upgrade")
        }
      }
    }

    checkRequest.onerror = (event) => {
      console.error("Erro ao verificar versão do banco de dados:", event)
      reject(new Error("Erro ao verificar versão do banco de dados"))
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
      try {
        // Criar uma nova transação para cada operação
        const transaction = db.transaction([MUSIC_STORE_NAME], "readwrite")
        const store = transaction.objectStore(MUSIC_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação:", event)
          db.close()
          reject(new Error("Erro na transação do banco de dados"))
        }

        transaction.oncomplete = () => {
          db.close()
          resolve()
        }

        // Executar a operação de salvamento
        store.put(musicToStore)
      } catch (error) {
        console.error("Erro ao executar transação:", error)
        db.close()
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
      try {
        const transaction = db.transaction([MUSIC_STORE_NAME], "readonly")
        const store = transaction.objectStore(MUSIC_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação de leitura:", event)
          db.close()
          reject(new Error("Erro na transação de leitura"))
        }

        const request = store.getAll()

        request.onerror = (event) => {
          console.error("Erro ao ler músicas:", event)
          db.close()
          reject(new Error("Erro ao ler músicas"))
        }

        request.onsuccess = () => {
          try {
            // Converter os dados armazenados de volta para o formato Music
            const musics: Music[] = (request.result || []).map((storedMusic: StoredMusic) => {
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

            db.close()
            resolve(musics)
          } catch (error) {
            console.error("Erro ao processar músicas:", error)
            db.close()
            reject(new Error("Erro ao processar músicas"))
          }
        }
      } catch (error) {
        console.error("Erro ao executar transação de leitura:", error)
        db.close()
        reject(error)
      }
    })
  } catch (error) {
    console.error("Erro ao carregar músicas:", error)
    // Retornar array vazio em caso de erro para evitar quebrar a aplicação
    return []
  }
}

// Função para remover uma música do IndexedDB
export const removeMusic = async (id: string): Promise<void> => {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([MUSIC_STORE_NAME], "readwrite")
        const store = transaction.objectStore(MUSIC_STORE_NAME)

        transaction.onerror = (event) => {
          console.error("Erro na transação de remoção:", event)
          db.close()
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
    console.error("Erro ao remover música:", error)
    throw error
  }
}
