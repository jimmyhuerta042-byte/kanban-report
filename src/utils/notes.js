/**
 * Utilidades para las notas de tarea: una "hoja" de texto libre con un
 * Markdown ligero (checkboxes, urgentes, listas, encabezados, código).
 *
 * No usamos una librería de Markdown para no añadir peso ni riesgo de XSS:
 * el parser reconoce solo un puñado de construcciones y renderiza a elementos
 * controlados por React (nunca dangerouslySetInnerHTML).
 */

/** Forma vacía de las notas de una tarea. */
export const emptyNotes = () => ({ content: '', updatedAt: null })

/**
 * Normaliza el valor de `notes` de una tarea. Devuelve siempre
 * { content, updatedAt }, tratando null/undefined (tarea sin notas) como vacío.
 */
export function normalizeNotes(notes) {
  if (!notes) return emptyNotes()
  return { content: notes.content || '', updatedAt: notes.updatedAt || null }
}

/** ¿La hoja tiene contenido real (más allá de espacios)? */
export const hasContent = (notes) => normalizeNotes(notes).content.trim().length > 0

const URGENT_RE = /^\s*(!{1,})\s*(.*)$/

/**
 * ¿La hoja contiene alguna línea urgente (empieza con !)? Usa el parser para
 * respetar los bloques de código (un "!!" dentro de ``` no cuenta como urgente),
 * de modo que la tarjeta y la vista muestren siempre lo mismo.
 */
export function hasUrgent(notes) {
  const { content } = normalizeNotes(notes)
  return parseNotes(content).some((t) => t.type === 'urgent')
}

/**
 * Alterna el estado de un checkbox en la línea `lineIndex` del contenido.
 * Devuelve el nuevo contenido (o el mismo si esa línea no es un checkbox).
 */
export function toggleChecklistLine(content, lineIndex) {
  const lines = content.split('\n')
  const line = lines[lineIndex]
  if (line == null) return content
  const m = line.match(/^(\s*[-*]\s+\[)([ xX])(\].*)$/)
  if (!m) return content
  const next = m[2] === ' ' ? 'x' : ' '
  lines[lineIndex] = `${m[1]}${next}${m[3]}`
  return lines.join('\n')
}

/**
 * Parsea el contenido a una lista de "tokens" de bloque para renderizar.
 * Cada token conserva `lineIndex` (índice de su línea original) para que los
 * checkboxes se puedan alternar directamente en la vista.
 *
 * Tipos: 'heading' | 'checkbox' | 'ordered' | 'urgent' | 'text' | 'blank'
 *        y 'code' (bloque delimitado por ```), que agrupa varias líneas.
 */
export function parseNotes(content) {
  const lines = content.split('\n')
  const tokens = []
  let inCode = false
  let codeBuffer = []
  let codeStart = 0

  lines.forEach((raw, i) => {
    const fence = raw.trim().startsWith('```')
    if (fence) {
      if (!inCode) {
        inCode = true
        codeBuffer = []
        codeStart = i
      } else {
        tokens.push({ type: 'code', text: codeBuffer.join('\n'), lineIndex: codeStart })
        inCode = false
      }
      return
    }
    if (inCode) {
      codeBuffer.push(raw)
      return
    }

    if (raw.trim() === '') {
      tokens.push({ type: 'blank', lineIndex: i })
      return
    }

    const heading = raw.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      tokens.push({ type: 'heading', level: heading[1].length, text: heading[2], lineIndex: i })
      return
    }

    const checkbox = raw.match(/^(\s*)[-*]\s+\[([ xX])\]\s*(.*)$/)
    if (checkbox) {
      tokens.push({
        type: 'checkbox',
        done: checkbox[2].toLowerCase() === 'x',
        text: checkbox[3],
        lineIndex: i,
      })
      return
    }

    const ordered = raw.match(/^(\s*)(\d+)\.\s+(.*)$/)
    if (ordered) {
      tokens.push({ type: 'ordered', num: ordered[2], text: ordered[3], lineIndex: i })
      return
    }

    const urgent = raw.match(URGENT_RE)
    if (urgent && raw.trim() !== '!' && raw.trim() !== '!!') {
      tokens.push({
        type: 'urgent',
        level: urgent[1].length,
        text: urgent[2],
        lineIndex: i,
      })
      return
    }

    tokens.push({ type: 'text', text: raw, lineIndex: i })
  })

  // Cierre defensivo: si quedó un bloque de código sin cerrar, lo emitimos igual.
  if (inCode) {
    tokens.push({ type: 'code', text: codeBuffer.join('\n'), lineIndex: codeStart })
  }

  return tokens
}
