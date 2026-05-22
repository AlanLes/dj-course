import { LOGO_PATH } from '../constants'

export async function loadLogo(path: string = LOGO_PATH): Promise<string | null> {
  try {
    const response = await fetch(path)
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('Failed to load PDF logo', err)
    return null
  }
}
