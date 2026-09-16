# Tienda CR: índices compuestos y políticas TTL

Las decisiones están en la [§12 del modelo de datos](modelo-de-datos-firestore.md#12-índices-compuestos-previstos):
los catorce índices compuestos, la exención de `catalogIndex.entries` y las cinco políticas TTL. Este documento no
las repite; explica **dónde viven y cómo se aplican**.

## Dónde vive cada cosa

| Qué                                   | Dónde                                                   |
| ------------------------------------- | ------------------------------------------------------- |
| Los catorce índices y la exención     | `libs/tienda/backend/firestore.indexes.json`            |
| El registro del archivo ante Firebase | `firebase.tienda.json`, en `firestore.indexes`          |
| Las cinco colecciones con TTL         | `libs/tienda/backend/ops/src/ttl-policies.ts`           |
| El script que aplica el TTL           | `libs/tienda/backend/ops/src/apply-ttl.ts`              |
| La prueba que fija la §12             | `libs/tienda/backend/ops/src/firestore-indexes.spec.ts` |

La prueba corre sin emuladores en `nx run tienda-ops:test` y falla si el JSON se separa de la §12.

## Aplicarlo a un proyecto real

Los dos comandos son el paso humano de
[#68](https://github.com/Darkmixt12/ws-steven-munoz/issues/68); aquí no se ejecutan contra nada real porque el
proyecto Firebase de la tienda todavía no existe.

**1. Los índices**, que sí sabe desplegar `firebase-tools`:

```sh
npx nx run tienda-ops:deploy-indexes -- --project=<id-del-proyecto>
```

**2. El TTL**, que `firebase-tools` no sabe hacer: el script habla directo con la API Admin de Firestore
(`PATCH …/collectionGroups/{colección}/fields/expiresAt?updateMask=ttlConfig`). Se autentica con Application
Default Credentials, así que primero hay que tener credenciales activas para ese proyecto. Conviene ver el plan
antes de enviarlo:

```sh
npx nx run tienda-ops:apply-ttl -- --project=<id-del-proyecto> --dry-run
npx nx run tienda-ops:apply-ttl -- --project=<id-del-proyecto>
```

`--dry-run` imprime las cinco llamadas y no toca la red. Sin `--dry-run`, el script consulta el estado de cada
campo y solo pide el TTL de los que aún no lo tienen, así que se puede repetir sin miedo. Firestore tarda un rato
en dejar cada política en `ACTIVE`.

## Tres cosas que conviene saber

- **`gcloud` no hace falta.** No está instalado en el entorno de desarrollo y el script no lo usa.
- **`dom` está en el `lib` del proyecto a propósito.** `gaxios` (el cliente HTTP de `google-auth-library`) declara
  sus opciones como `GaxiosOptions extends RequestInit`, y `RequestInit` vive en el lib del DOM. Sin él el tipo
  pierde `method` y el script no compila.
- **La exención sobre un mapa está sin confirmar contra Firestore real.** `entries` es un mapa, y la exención se
  declara sobre el campo entero como dice la §12. Si al desplegar en #68 Firestore pidiera una exención por
  subcampo, hay que corregir `fieldOverrides`; el despliegue lo dirá.
