import type React from "react"
import "./globals.css"
import { exo, rajdhani } from "./fonts"

export const metadata = {
  title: "Meu App de Música",
  description: "Aplicativo de música com tema anime",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${exo.variable} ${rajdhani.variable}`}>
      <body>{children}</body>
    </html>
  )
}
