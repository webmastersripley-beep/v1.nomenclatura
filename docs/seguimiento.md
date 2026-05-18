# Seguimiento técnico

## Implementado

### Motor de nomenclaturas
- `descriptor_mode` conectado al nombre final.
- Soporte para:
  - solo categoría
  - marca + categoría
  - categoría + marca
  - solo marca
- Recalculo automático de nombres al guardar configuración.
- Campo editable de marca en la etapa de edición.

### Apariencia
- Configuración visual reorganizada y más responsive.
- Preview visual mejorado.
- Preview en vivo del nombre final.
- Subida real de imagen de fondo a Supabase Storage.

### Campañas
- Edición de campañas existentes.
- Reactivación de campañas.
- Validación de código limpio.
- Validación real de máximo 4 campañas simultáneas también al editar/reactivar.
- Refuerzo en base de datos con trigger para impedir más de 4 solapadas.

### Validaciones
- URL de fondo válida.
- Opacidad entre 0 y 1.
- Tema válido.
- Descriptor válido.
- Código de campaña válido.

### Descargas
- ZIP refactorizado con manifiesto testeable.
- Verificación de:
  - directo
  - carpeta única
  - por familia
  - por formato

### Historial
- Nueva UI de historial.
- Filtro por usuario.
- Filtro por campaña.
- Visualización de archivos generados.

### Infraestructura Supabase
- Migración de esquema núcleo.
- Bucket `backgrounds`.
- Policies de compatibilidad para el flujo actual.
- Documentación de despliegue.

## Validado

- `npm.cmd run build`
- `npm.cmd run test:zip`

## Pendiente recomendado

1. Cambiar la clave expuesta en frontend por una `anon` real y rotar cualquier `service_role` expuesta.
2. Migrar el login simple a Supabase Auth para endurecer RLS de forma real.
3. Hacer QA visual final en navegador real sobre:
   - modal de configuración,
   - historial,
   - subida de fondo,
   - campañas cruzadas.
4. Opcional: dividir el bundle grande con code splitting.
