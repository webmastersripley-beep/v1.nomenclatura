# Nomenclaturas retail

Motor de nomenclaturas para imágenes retail:

```text
subir imágenes
→ agrupar familias
→ seleccionar campaña
→ generar nombres
→ validar
→ comprimir opcionalmente
→ descargar ZIP / metadata
→ guardar trazabilidad
```

## Desarrollo

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
VITE_ENABLE_AI_ANALYSIS=false
VITE_AI_API_URL=
GEMINI_API_KEY=TU_CLAVE_GEMINI
GEMINI_MODEL=gemini-2.5-flash-lite
```

Deja `VITE_ENABLE_AI_ANALYSIS=false` mientras haces pruebas para no consumir IA. Cambialo a `true` solo cuando quieras analizar con Gemini y reinicia `npm run dev`.

No uses una clave `service_role` en el frontend.

## Produccion en Vercel

El proyecto queda preparado para desplegar frontend y API juntos en Vercel:

```text
npm run build
dist/
api/analyze-image.js
```

Configura estas variables en Vercel:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
VITE_ENABLE_AI_ANALYSIS=true
VITE_AI_API_URL=
GEMINI_API_KEY=TU_CLAVE_GEMINI
GEMINI_MODEL=gemini-2.5-flash-lite
```

`VITE_AI_API_URL` debe quedar vacia en Vercel para usar la ruta relativa `/api/analyze-image`. En desarrollo local con `server.js`, puedes poner `http://localhost:3001`.

## Base de datos

Las migraciones están en [`supabase/migrations`](./supabase/migrations).
La guía de despliegue está en [`supabase/README.md`](./supabase/README.md).

## Seguimiento

El estado actual de implementación está resumido en [`docs/seguimiento.md`](./docs/seguimiento.md).
