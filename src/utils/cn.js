/**
 * Une clases condicionales de forma simple sin dependencias externas.
 * Acepta strings, undefined, false y objetos { clase: boolean }.
 */
export function cn(...args) {
  const out = []
  for (const arg of args) {
    if (!arg) continue
    if (typeof arg === 'string') {
      out.push(arg)
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) out.push(key)
      }
    }
  }
  return out.join(' ')
}
