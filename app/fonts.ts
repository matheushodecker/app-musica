import { Exo, Rajdhani } from "next/font/google"

export const exo = Exo({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-exo",
})

export const rajdhani = Rajdhani({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
})
