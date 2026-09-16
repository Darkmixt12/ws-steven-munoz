# Tienda CR: las semillas del primer Administrador y la configuración base

Una base de datos vacía no deja entrar a nadie: el Panel exige un Empleado Activo, y no hay Panel desde donde
crear el primero. Estas semillas resuelven ese arranque, y lo pide
[#67](https://github.com/Darkmixt12/ws-steven-munoz/issues/67).

Los campos de cada documento están en el modelo de datos —[§5.4](modelo-de-datos-firestore.md#54-employeesuid)
el Empleado, [§5.6](modelo-de-datos-firestore.md#56-staffdirectoryuid) el directorio,
[§5.7](modelo-de-datos-firestore.md#57-consentsconsentid) el Consentimiento,
[§6.3](modelo-de-datos-firestore.md#63-countersordernumber) el contador,
[§7.1](modelo-de-datos-firestore.md#71-settingsstorefront) la Configuración y
[§7.3](modelo-de-datos-firestore.md#73-privacynoticesversion) el Aviso—; este documento no los repite. Explica
**qué se siembra, dónde vive y cómo se corre**.

## Qué se siembra

Seis documentos, en un solo lote y en este orden:

1. `privacyNotices/{versión}` — la primera versión del Aviso de privacidad. Va primero porque las reglas exigen
   que exista la versión a la que apunta la Configuración.
2. `employees/{uid}` — el primer Administrador, Activo. Se autoinvita: no hay nadie que pueda invitarlo.
3. `staffDirectory/{uid}` — su nombre, que es lo que ven los demás Roles como Autor de una acción.
4. `counters/orderNumber` — el número del primer Pedido.
5. `settings/storefront` — la Configuración base, apuntando al Aviso recién sembrado.
6. `consents/{autoId}` — la evidencia de que ese Administrador aceptó el Aviso para entrar al Panel.

`settings/issuer` **no** se siembra: lo llena el Administrador desde el Panel, y por eso las reglas le permiten
crearlo además de actualizarlo.

## Dónde vive cada cosa

| Qué                                        | Dónde                                                    |
| ------------------------------------------ | -------------------------------------------------------- |
| Los valores de la Configuración            | `libs/tienda/backend/ops/seed/storefront.json`           |
| El texto del primer Aviso                  | `libs/tienda/backend/ops/seed/privacy-notice-2026-01.md` |
| La forma de cada documento                 | `libs/tienda/backend/ops/src/seed-data.ts`               |
| El script                                  | `libs/tienda/backend/ops/src/seed.ts`                    |
| La huella del Aviso (`privacyNoticeHash`)  | `libs/tienda/shared/domain/src/privacy.ts`               |
| La prueba de las formas, sin emuladores    | `libs/tienda/backend/ops/src/seed-data.spec.ts`          |
| La prueba contra las reglas, con emulador  | `libs/tienda/backend/rules/src/seed.spec.ts`             |

Las dos pruebas se reparten el trabajo: `seed-data.spec.ts` fija los valores y las formas y corre en
`nx run tienda-ops:test`; `seed.spec.ts` siembra los ficheros versionados de verdad en el emulador y comprueba
quién lee qué, porque el Admin SDK se salta las reglas y sin eso la semilla podría crear documentos que el Panel
no pudiera leer ni volver a guardar.

## Ver el plan sin tocar nada

`--dry-run` imprime los seis documentos y no se conecta a ningún proyecto, así que no necesita emuladores ni
credenciales:

```sh
npx nx run tienda-ops:seed -- --project-id=demo-tienda-cr --email=admin@tienda.cr --dry-run
```

Argumentos: `--project-id` y `--email` son obligatorios; `--name` (por omisión `Administrador`) y
`--first-order-number` (por omisión `1001`) son opcionales.

## Correrlo contra los emuladores

Los emuladores piden **Java 21**. En una terminal:

```sh
npx firebase emulators:start --config firebase.tienda.json --project demo-tienda-cr --only firestore,auth
```

En otra, apuntando el Admin SDK a los emuladores en vez de a Internet (PowerShell):

```powershell
$env:FIRESTORE_EMULATOR_HOST = 'localhost:8080'
$env:FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
npx nx run tienda-ops:seed -- --project-id=demo-tienda-cr --email=admin@tienda.cr
```

Los puertos salen de `firebase.tienda.json`. Un id de proyecto que empiece por `demo-` solo existe en los
emuladores, así que el script se niega a arrancar si falta `FIRESTORE_EMULATOR_HOST`: sin esa guarda saldría a
buscar un proyecto que no está.

## Sembrar un proyecto real

Fue el paso humano de [#68](https://github.com/Darkmixt12/ws-steven-munoz/issues/68), **ya ejecutado contra
`tienda-cr`**: los seis documentos están sembrados con los datos reales de la tienda. El script se autentica con
Application Default Credentials y la orden es la misma sin las variables de entorno, con el id real.

**Antes hay que reemplazar los marcadores.** Los valores de `storefront.json` (tarifas, SINPE, datos de contacto)
y el texto del Aviso son borradores de trabajo. El Aviso, además, no se edita nunca una vez publicado: corregirlo
es publicar una versión nueva, porque la evidencia de Consentimiento apunta a la huella de su texto.

La contraseña inicial sale de `SEED_ADMIN_PASSWORD` si está definida; si no, el script genera una al azar y la
imprime **una sola vez**. No queda en ningún fichero. Conviene cambiarla al primer ingreso.

## Tres cosas que conviene saber

- **Aquí el proyecto se nombra `--project-id`, no `--project` como en `apply-ttl.ts`.** No es un descuido:
  `tsconfig-paths/register`, que este script necesita para resolver `tienda/domain` en ejecución, se queda con
  `--project` y `-P` de la línea de órdenes para buscar su propio tsconfig. Con las dos banderas presentes las
  junta en una lista y falla antes de que el script arranque, con un error que no menciona nada de esto.
- **Volver a correrlo no cuesta nada, pero no arregla nada.** El script crea solo lo que falta y nunca
  sobrescribe: un segundo pase no reinicia el contador de una tienda que ya despachó Pedidos. Por lo mismo,
  cambiar un valor de `storefront.json` y volver a sembrar **no** actualiza la Configuración ya creada; eso se
  hace desde el Panel.
- **Si el correo ya tiene Cuenta de Auth, el script la reutiliza y no la toca.** Si esa Cuenta tiene el correo sin
  verificar, avisa y sigue: las reglas exigen `email_verified`, así que el Panel la rechazará hasta que se
  verifique. Modificar una Cuenta existente sería salirse de «solo crear».
