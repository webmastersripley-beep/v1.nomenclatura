# Supabase setup

Este proyecto ya trae migraciones para levantar la base mínima que espera la app:

- `app_users`
- `user_preferences`
- `campaigns`
- `processes`
- `process_items`
- bucket público `backgrounds`

## Aplicación

Con Supabase CLI:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

O bien, pega el contenido de `supabase/migrations/*.sql` en el SQL Editor del dashboard, en orden.

## Variables de entorno

Usa en el frontend:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

No uses la `service_role` en el navegador. Si una clave JWT contiene el rol `service_role`, debe quedarse solo en backend y rotarse si fue expuesta.

## Nota de seguridad

La app hoy inicia sesión por nombre desde `app_users`, no con Supabase Auth. Por eso las policies incluidas son de compatibilidad: permiten a la app actual leer/escribir las entidades que necesita desde el cliente.

Cuando el proyecto pase a autenticación real, el siguiente endurecimiento recomendado es:

1. migrar usuarios a Supabase Auth,
2. guardar `auth.uid()` en preferencias/procesos,
3. reemplazar las policies permisivas por reglas de propiedad,
4. dejar las campañas bajo permisos de rol/admin.
