import { jsPDF } from 'jspdf'
import { formatDate } from '../utils/dates'
import { contrastText } from '../utils/colors'
import { loadHeaderLogos } from './logos'

/* Convierte "#rrggbb" a [r,g,b] para jsPDF. */
function rgb(hex) {
  const c = (hex || '#cbd5e1').replace('#', '')
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ]
}

/* Dibuja un rectángulo redondeado relleno. */
function fillRoundRect(doc, x, y, w, h, r, color) {
  doc.setFillColor(...color)
  doc.roundedRect(x, y, w, h, r, r, 'F')
}

/**
 * Recorta un texto de una sola línea para que no exceda `maxW` (en las mismas
 * unidades que la fuente activa). Añade "…" si hace falta.
 */
function truncate(doc, text, maxW) {
  const str = String(text || '')
  if (doc.getTextWidth(str) <= maxW) return str
  let out = str
  while (out.length > 1 && doc.getTextWidth(out + '…') > maxW) {
    out = out.slice(0, -1)
  }
  return out + '…'
}

/**
 * Exporta una versión visual y simplificada del tablero (columnas + tarjetas)
 * en una sola hoja horizontal (A4 landscape), en inglés y con formato profesional.
 *
 * `tasks` ya viene filtrada. `statuses` en orden.
 */
export async function exportBoardPDF(tasks, { statuses, getType, getAssignees, getProject }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const PAGE_W = doc.internal.pageSize.getWidth()
  const PAGE_H = doc.internal.pageSize.getHeight()
  const MARGIN = 28

  /* ----------------------------- Encabezado ----------------------------- */
  const { left, right } = await loadHeaderLogos()

  const headerTop = MARGIN
  const logoMaxH = 34
  const logoMaxW = 130

  const drawLogo = (logo, align) => {
    if (!logo) return
    const ratio = logo.width / logo.height
    let h = logoMaxH
    let w = h * ratio
    if (w > logoMaxW) {
      w = logoMaxW
      h = w / ratio
    }
    const x = align === 'left' ? MARGIN : PAGE_W - MARGIN - w
    const y = headerTop + (logoMaxH - h) / 2
    doc.addImage(logo.dataUrl, logo.format, x, y, w, h)
  }
  drawLogo(left, 'left')
  drawLogo(right, 'right')

  // Título centrado
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(30, 41, 59)
  doc.text('Kanban Board Report', PAGE_W / 2, headerTop + 15, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  const generated = formatDate(new Date().toISOString())
  doc.text(
    `Generated: ${generated}   ·   ${tasks.length} task(s)`,
    PAGE_W / 2,
    headerTop + 29,
    { align: 'center' }
  )

  // Línea separadora
  const headerBottom = headerTop + logoMaxH + 12
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.line(MARGIN, headerBottom, PAGE_W - MARGIN, headerBottom)

  /* --------------------- Geometría del tablero (natural) --------------------- */
  // Medidas base "naturales"; luego todo se escala para caber en la página.
  const COL_W = 150
  const COL_GAP = 12
  const COL_HEADER_H = 22
  const CARD_GAP = 6
  const CARD_PAD = 6
  const CARD_TITLE_LH = 9 // alto de línea del título
  const CARD_MAX_TITLE_LINES = 3
  const CARD_META_H = 9 // línea de ticket/proyecto
  const COL_INNER_TOP = COL_HEADER_H + 8

  const tasksOf = (statusId) => tasks.filter((t) => t.statusId === statusId)

  // Ancho útil de texto dentro de la tarjeta (unidades naturales).
  const CARD_W = COL_W - 10 // ancho de la tarjeta dentro de la columna
  const TEXT_W = CARD_W - CARD_PAD * 2 - 2 // descontando el borde de color y padding

  // Tamaños de fuente base (unidades naturales). El wrapping se hace a este
  // tamaño contra TEXT_W; como al dibujar escalamos posición y fuente por el
  // mismo factor, el ajuste se mantiene idéntico a cualquier escala.
  const FS_META = 6.5
  const FS_TITLE = 7

  // Pre-cálculo de la altura de cada tarjeta (según líneas del título).
  const wrapTitle = (title) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(FS_TITLE)
    const lines = doc.splitTextToSize(String(title || ''), TEXT_W)
    return lines.slice(0, CARD_MAX_TITLE_LINES)
  }

  const cardHeight = (task) => {
    const lines = wrapTitle(task.title).length
    let h = CARD_PAD + CARD_META_H + 2 + lines * CARD_TITLE_LH + CARD_PAD
    const project = getProject ? getProject(task.projectId) : null
    if (project) h += CARD_META_H
    const people = getAssignees(task.assigneeIds)
    if (people.length) h += 12
    return h
  }

  // Alto natural del tablero = columna más alta.
  let maxColContentH = 0
  const columnData = statuses.map((status) => {
    const colTasks = tasksOf(status.id)
    let y = COL_INNER_TOP
    const cards = colTasks.map((task) => {
      const h = cardHeight(task)
      const card = { task, y, h }
      y += h + CARD_GAP
      return card
    })
    const contentH = Math.max(y, COL_INNER_TOP + 20)
    maxColContentH = Math.max(maxColContentH, contentH)
    return { status, cards, contentH }
  })

  const boardNaturalW = statuses.length * COL_W + (statuses.length - 1) * COL_GAP
  const boardNaturalH = maxColContentH + 8

  /* ------------------------- Escalado a una hoja ------------------------- */
  const availW = PAGE_W - MARGIN * 2
  const availH = PAGE_H - headerBottom - 12 - MARGIN
  const scale = Math.min(availW / boardNaturalW, availH / boardNaturalH, 1)

  const boardW = boardNaturalW * scale
  const boardH = boardNaturalH * scale
  const originX = MARGIN + (availW - boardW) / 2
  const originY = headerBottom + 14

  const S = (v) => v * scale
  const px = (v) => originX + v * scale
  const py = (v) => originY + v * scale

  /* ----------------------------- Dibujo ----------------------------- */
  columnData.forEach((col, i) => {
    const colX = i * (COL_W + COL_GAP)

    // Cuerpo de la columna
    fillRoundRect(doc, px(colX), py(0), S(COL_W), boardH, S(6), [241, 245, 249])

    // Encabezado de la columna
    const headColor = rgb(col.status.color)
    fillRoundRect(doc, px(colX), py(0), S(COL_W), S(COL_HEADER_H), S(6), headColor)
    // Recorte inferior del redondeo del header (rectángulo que empalma)
    doc.setFillColor(...headColor)
    doc.rect(px(colX), py(COL_HEADER_H - 6), S(COL_W), S(6), 'F')

    const headText = contrastText(col.status.color) === '#ffffff' ? [255, 255, 255] : [15, 23, 42]
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(Math.max(6, S(8)))
    doc.setTextColor(...headText)
    const name = col.status.name.toUpperCase()
    doc.text(name, px(colX + CARD_PAD), py(COL_HEADER_H / 2) + S(3))
    // Contador
    const count = col.cards.length
    doc.setFontSize(Math.max(6, S(8)))
    doc.text(String(count), px(colX + COL_W - CARD_PAD), py(COL_HEADER_H / 2) + S(3), {
      align: 'right',
    })

    // Tarjetas
    col.cards.forEach(({ task, y, h }) => {
      const cardX = colX + 5
      const type = getType(task.typeId)
      const project = getProject ? getProject(task.projectId) : null

      // Fondo tarjeta
      fillRoundRect(doc, px(cardX), py(y), S(CARD_W), S(h), S(4), [255, 255, 255])
      // Borde izquierdo del color del tipo
      doc.setFillColor(...rgb(type?.color))
      doc.rect(px(cardX), py(y), S(3), S(h), 'F')

      const textX = cardX + CARD_PAD + 2 // inicio del texto (después del borde)
      const rightX = cardX + CARD_W - CARD_PAD // límite derecho del contenido
      const innerW = S(rightX - textX) // ancho útil escalado (para medir)
      let cursorY = y + CARD_PAD + 6

      // ---- Línea meta: ticket (izq) + tipo (der) ----
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(S(FS_META))
      const ticket = (task.ticket || `#${task.code}`).toString()
      const typeName = type ? type.name : ''
      // Reservamos el ancho del tipo a la derecha y truncamos el ticket a lo que sobre.
      const typeW = typeName ? doc.getTextWidth(typeName) : 0
      const ticketMaxW = Math.max(0, innerW - typeW - S(4))
      doc.setTextColor(100, 116, 139)
      doc.text(truncate(doc, ticket, ticketMaxW), px(textX), py(cursorY))
      if (typeName) {
        doc.setTextColor(...rgb(type.color))
        doc.text(truncate(doc, typeName, innerW), px(rightX), py(cursorY), { align: 'right' })
      }
      cursorY += CARD_META_H

      // ---- Proyecto ----
      if (project) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(S(FS_META))
        doc.setTextColor(...rgb(project.color))
        doc.text(truncate(doc, project.name, innerW), px(textX), py(cursorY))
        cursorY += CARD_META_H
      }

      // ---- Título (multilínea, ya ajustado a TEXT_W) ----
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(S(FS_TITLE))
      doc.setTextColor(30, 41, 59)
      const titleLines = doc.splitTextToSize(String(task.title || ''), innerW).slice(
        0,
        CARD_MAX_TITLE_LINES
      )
      titleLines.forEach((line, li) => {
        doc.text(line, px(textX), py(cursorY + 2 + li * CARD_TITLE_LH))
      })
      cursorY += titleLines.length * CARD_TITLE_LH + 2

      // ---- Responsables (chips) ----
      const people = getAssignees(task.assigneeIds)
      if (people.length) {
        let chipX = textX
        const chipY = cursorY + 2
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(S(FS_META))
        for (const a of people) {
          const label = a.name
          const chipW = (doc.getTextWidth(label) + S(8)) / scale // → unidades naturales
          if (chipX + chipW > rightX) break // no desbordar la tarjeta
          fillRoundRect(doc, px(chipX), py(chipY), S(chipW), S(9), S(4), rgb(a.color))
          const tc = contrastText(a.color) === '#ffffff' ? [255, 255, 255] : [15, 23, 42]
          doc.setTextColor(...tc)
          doc.text(label, px(chipX + chipW / 2), py(chipY + 6.5), { align: 'center' })
          chipX += chipW + 3
        }
      }
    })

    // Columna vacía
    if (col.cards.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(Math.max(5, S(7)))
      doc.setTextColor(148, 163, 184)
      doc.text('No tasks', px(colX + COL_W / 2), py(COL_INNER_TOP + 16), { align: 'center' })
    }
  })

  /* ------------------------------ Pie ------------------------------ */
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Kanban Board — task management report', PAGE_W / 2, PAGE_H - 14, {
    align: 'center',
  })

  doc.save(`kanban-board-${generated.replace(/\//g, '-')}.pdf`)
}
