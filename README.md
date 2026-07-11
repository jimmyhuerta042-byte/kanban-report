# Kanban Board

Aplicación web para gestionar tareas de desarrollo mediante un tablero Kanban.
Reemplaza el antiguo Excel con macros. **Sin backend ni base de datos**: todo se
guarda automáticamente en el `LocalStorage` del navegador.

## Tecnologías

- React + Vite
- JavaScript (sin TypeScript)
- Tailwind CSS
- dnd-kit (Drag & Drop)
- Lucide React (iconos)
- dayjs (fechas)
- jsPDF + jspdf-autotable (exportación PDF)

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto http://127.0.0.1:5173).

Para generar la build de producción:

```bash
npm run build
npm run preview
```

## Compartir el tablero (sin backend)

Como todo vive en `LocalStorage`, cada navegador tiene su propia copia. Para
compartir el estado con tu equipo usa el menú **Datos** de la barra lateral:

- **Exportar**: descarga un archivo `kanban-backup-*.json` con TODO el tablero.
- **Importar**: carga ese archivo en otro navegador/equipo (reemplaza el contenido
  actual; te pide confirmación antes).
- **Reiniciar**: vuelve a los datos de ejemplo.

Flujo típico: tú gestionas el tablero, exportas el JSON y se lo pasas al equipo;
ellos lo importan para ver el mismo estado. (Para edición colaborativa en vivo,
ver "Modo compartido con Supabase" más abajo.)

## Desplegar gratis en GitHub Pages

La app es 100% estática, así que se publica gratis en GitHub Pages con HTTPS.

**Opción A — automático (recomendado):** ya viene un workflow en
`.github/workflows/deploy.yml`. Solo:

1. Sube el proyecto a un repositorio de GitHub.
2. En el repo: **Settings → Pages → Source → "GitHub Actions"**.
3. Cada `git push` a `main`/`master` publica en
   `https://<usuario>.github.io/<repo>/`.

El workflow ajusta automáticamente la ruta base al nombre del repo.

**Opción B — manual desde tu PC:**

```bash
# Reemplaza <repo> por el nombre exacto del repositorio en GitHub
VITE_BASE=/<repo>/ npm run build
npm run deploy
```

> Otras alternativas gratis para sitios estáticos: **Netlify**, **Vercel**,
> **Cloudflare Pages**. Evita hosting compartido tipo Hostgator: es para
> PHP/WordPress, suele ser de pago y no aporta nada aquí.

## Colaboración en vivo

¿Necesitas que **varias personas editen y vean cambios en tiempo real**? Ya está
implementado con Supabase. Ver **"Modo compartido con Supabase"** más abajo.

## Funcionalidades

- **Tablero Kanban** con Drag & Drop entre columnas. Al mover una tarjeta se
  actualiza el estado, se registra el inicio del nuevo estado y el cierre del anterior.
- **Filtros combinables** (panel desplegable): nombre/ticket, responsable, proyecto,
  estado, tipo y rango de fechas de Backlog.
- **Exportar PDF**: versión visual del tablero (columnas + tarjetas) en una hoja
  horizontal, en inglés, con dos logos en el encabezado; incluye solo lo filtrado.
- **Gestión de Estados**: crear, editar, eliminar y reordenar (Drag & Drop) las columnas.
- **Gestión de Proyectos**: agrupa tareas por proyecto (nombre + color).
- **Gestión de Tipos de Tarea**: nombre, icono (emoji) y color; el color identifica las tarjetas.
- **Gestión de Responsables**: nombre y color; una tarea puede tener varios.
- **Tareas**: ID automático, N° de ticket, proyecto, nombre, descripción, estado,
  tipo, responsables, fechas y enlaces GitLab / Makaha.
- **Datos**: exportar / importar respaldo JSON y reiniciar.

## Persistencia y modos

La app tiene **dos modos** y elige automáticamente según haya credenciales:

- **Modo local (por defecto):** sin configurar nada, todo se guarda en
  `LocalStorage` (prefijo `kanban.*`). Cada navegador tiene su copia. Ideal para
  desarrollo o uso individual. La barra lateral muestra “Local”.
- **Modo compartido (Supabase):** al poner las credenciales en `.env`, el tablero
  pasa a una base de datos en la nube: **varias personas ven y editan el mismo
  tablero en vivo**. La barra lateral muestra “Conectado (nube)”.

En ambos modos, el menú **Datos** (exportar / importar JSON) sigue disponible
como respaldo.

## Modo compartido con Supabase (colaboración en vivo)

Pensado para equipos pequeños (1–3 personas). La capa gratuita de Supabase sobra
para este volumen (el tablero pesa kilobytes).

1. Crea un proyecto gratis en <https://supabase.com>.
2. En el proyecto, abre **SQL Editor**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo (crea las tablas, las
   políticas, el realtime y datos de ejemplo).
3. Ve a **Settings → API** y copia **Project URL** y la clave **anon public**.
4. Copia `.env.example` a `.env` y pega ambos valores:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
5. Reinicia `npm run dev`. La barra lateral debe decir “Conectado (nube)”.

**Notas:**
- El tablero es **abierto** (sin login): cualquiera con la URL de la app y las
  credenciales puede editar. Suficiente para uso interno; se puede endurecer con
  Supabase Auth más adelante.
- Para desplegar en GitHub Pages con modo compartido, define `VITE_SUPABASE_URL`
  y `VITE_SUPABASE_ANON_KEY` como **secrets** del repositorio y pásalos al build
  en el workflow (junto a `VITE_BASE`).
- El proyecto free de Supabase se **pausa** tras ~1 semana sin actividad; con uso
  diario no ocurre y reactivarlo es un clic.

## Estructura

```
src/
  components/   ui, kanban, modals, filters, DataMenu
  pages/        Dashboard, StatusesPage, TypesPage, AssigneesPage, ProjectsPage
  layouts/      AppLayout, ManagementLayout
  hooks/        useFilteredTasks, useLocalStorageState
  context/      BoardContext (local + Supabase), ToastContext
  services/     storage (LocalStorage), supabase, db (capa de datos), pdf, backup, logos
  utils/        dates, colors, cn, id
  data/         seed
supabase/
  schema.sql    esquema + RLS + realtime + datos de ejemplo
```
