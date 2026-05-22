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
GEMINI_API_KEY=TU_CLAVE_GEMINI
```

Deja `VITE_ENABLE_AI_ANALYSIS=false` mientras haces pruebas para no consumir IA. Cambialo a `true` solo cuando quieras analizar con Gemini y reinicia `npm run dev`.

No uses una clave `service_role` en el frontend.

## Base de datos

Las migraciones están en [`supabase/migrations`](./supabase/migrations).
La guía de despliegue está en [`supabase/README.md`](./supabase/README.md).

## Seguimiento

El estado actual de implementación está resumido en [`docs/seguimiento.md`](./docs/seguimiento.md).
