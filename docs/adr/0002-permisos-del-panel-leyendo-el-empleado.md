# Los Permisos del Panel se verifican leyendo el Empleado, no con custom claims

El único origen del Rol y del estado de un Empleado es su documento `employees/{uid}`. Las reglas de Firestore lo leen con `get()` y exigen estado Activo, correo verificado y que el Rol tenga el Permiso pedido, según una tabla Rol → Permisos espejo de la del código. Las Cloud Functions leen el mismo documento con el Admin SDK. No se ponen claims de Rol en el token. Al deshabilitar un Empleado o cambiarle el Rol, el corte es inmediato porque la próxima evaluación de reglas ya ve el documento nuevo.

## Considered Options

- **Solo custom claims** (el Rol en el token, las reglas leen `request.auth.token`): descartado porque el token vive hasta una hora y `revokeRefreshTokens` no hace que las reglas rechacen un ID token ya emitido; un Empleado deshabilitado conservaría el acceso hasta que venza.
- **Claims y documento a la vez**: descartado porque son dos orígenes que sincronizar para un beneficio marginal (ahorrar lecturas en una tienda de bajo volumen).
- **Revocar sesiones al deshabilitar**: descartado porque `revokeRefreshTokens` cierra toda la Cuenta, incluida la sesión de su Cliente, y deshabilitar al Empleado no debe afectar al Cliente de la misma Cuenta.

## Consequences

- Cada petición del Panel cuesta una lectura extra del Empleado (se cobra una vez por petición) y consume una de las 10 llamadas `get()`/`exists()` permitidas (20 en lotes y transacciones).
- La tabla Rol → Permisos existe en dos sitios, el código y las reglas, y deben mantenerse iguales.
- El Panel observa su propio Empleado para salir en cuanto deje de estar Activo o cambie de Rol; eso es solo experiencia de usuario, quien corta es la regla.
- Las Cloud Functions no confían en el token para el Rol: siempre releen el Empleado.
