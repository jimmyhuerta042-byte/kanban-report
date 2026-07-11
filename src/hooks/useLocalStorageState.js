import { useEffect, useRef, useState } from 'react'
import { readStorage, writeStorage } from '../services/storage'

/**
 * Estado de React sincronizado automáticamente con LocalStorage.
 * `init` es el valor inicial si no existe nada guardado (o una función que lo produce).
 */
export function useLocalStorageState(key, init) {
  const [value, setValue] = useState(() => {
    const fallback = typeof init === 'function' ? init() : init
    return readStorage(key, fallback)
  })

  // Evita escribir en el primer render (ya viene de storage).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    writeStorage(key, value)
  }, [key, value])

  return [value, setValue]
}
