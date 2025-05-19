export interface Music {
  id: string
  name: string
  artist?: string
  file: File
  url: string
  duration: number
}

export interface StoredMusicFile {
  name: string
  type: string
  size: number
  lastModified: number
  data: ArrayBuffer
}

export interface StoredMusic extends Omit<Music, "file"> {
  file: StoredMusicFile
}
