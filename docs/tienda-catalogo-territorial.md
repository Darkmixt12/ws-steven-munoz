# Tienda CR: catálogo territorial DTA-2026

La decisión de fondo —por qué el catálogo no coincide tal cual con ninguna fuente publicada— está en el
[ADR 0009](adr/0009-el-catalogo-territorial-sale-del-ign-con-un-distrito-de-hacienda.md), y la forma del dato en
la [§5.2 del modelo de datos](modelo-de-datos-firestore.md). Este documento no las repite; explica **dónde vive
el catálogo y cómo se regenera**.

## Dónde vive cada cosa

| Qué                                    | Dónde                                                 |
| -------------------------------------- | ----------------------------------------------------- |
| La fuente que se revisa (494 filas)    | `libs/tienda/shared/domain/data/dta-2026.tsv`         |
| El JSON que importa la librería        | `libs/tienda/shared/domain/data/dta-2026.json`        |
| El generador y sus comprobaciones      | `libs/tienda/shared/domain/scripts/build-dta.ts`      |
| La versión, el tipo y la búsqueda      | `libs/tienda/shared/domain/src/territory.ts`          |
| La prueba que fija los conteos         | `libs/tienda/shared/domain/src/territory.spec.ts`     |

Los dos archivos de `data/` se commitean: el TSV porque es lo que se lee en una revisión, el JSON porque es lo
que importa la librería. El catálogo no es una colección de Firestore, así que no hay nada que desplegar.

## Regenerar el catálogo

Se edita el **TSV**, nunca el JSON, y se vuelve a correr el generador:

```sh
npx nx run tienda-domain:build-dta
```

El script comprueba 7 provincias, 84 cantones y 494 distritos, la presencia de Pijije (`50405`) y Cabagra
(`60310`), el formato `^[0-9]{5}$`, que no haya códigos repetidos, que el nombre de provincia y de cantón sea el
mismo en todas las filas del prefijo, y que el TSV esté ordenado. Si algo no cuadra sale con código 1 y **no
escribe el JSON**. Después hay que commitear el JSON regenerado junto con el TSV.

## Tres cosas que conviene saber

- **Ninguna fuente publicada trae los 494.** La DTA-2026 del IGN dice 494 en la portada pero su tabla lista 493:
  le falta `70605` Duacarí, en Guácimo. El XLSX de Hacienda trae 492, sin Pijije ni Cabagra, pero sí trae
  Duacarí. El catálogo es el del IGN más ese distrito; el ADR 0009 lo explica.
- **Grecia se numera como el IGN.** El IGN dejó vacío el `20306` cuando Río Cuarto pasó a ser cantón, así que
  `20307` es Puente de Piedra y `20308` es Bolívar. Hacienda renumeró a `20306`/`20307` para los mismos siete
  distritos. Como `districtCode` es también el código postal de Correos, la diferencia importa: si algún día se
  emiten Comprobantes electrónicos hay que mapear los siete distritos de Grecia al código de Hacienda.
- **La búsqueda es solo por código.** `findDistrict` resuelve un código de 5 dígitos y devuelve `null` si no
  está. Los listados provincia → cantón → distrito que pide el formulario de Dirección no están aquí todavía.
