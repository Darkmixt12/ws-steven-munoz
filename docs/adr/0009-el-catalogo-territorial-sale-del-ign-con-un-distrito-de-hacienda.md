# El catálogo territorial sale del IGN con un distrito de Hacienda

El catálogo territorial de la tienda es la División Territorial Administrativa 2026 del Instituto Geográfico
Nacional: sus códigos y sus nombres. A esas 493 filas se les suma un distrito que el IGN no lista, `70605`
Duacarí (Guácimo, Limón), que se toma del XLSX de códigos de ubicación de Hacienda —la única fuente que lo
trae—, con la grafía del IGN para su provincia y su cantón. Son los 494 distritos que exige el #66. Se
corrigen además dos tildes que el IGN pierde, `10308` San Cristóbal y `20308` Bolívar, verificadas contra el
texto del propio PDF, que sí acentúa el resto de los nombres.

Hizo falta decidirlo porque **ninguna fuente publicada trae los 494**. La DTA-2026 anuncia 494 distritos en la
portada y lista 493 en la tabla; Guácimo aparece con cuatro distritos cuando oficialmente tiene cinco. El XLSX
de Hacienda, modificado por última vez en diciembre de 2022, trae 492: le faltan los dos distritos creados
después, Pijije (`50405`) y Cabagra (`60310`), que el #66 exige nombrar. La tabla del IGN se extrajo con dos
parsers independientes que dieron los mismos 493 códigos, así que la ausencia de Duacarí es del documento, no
de la extracción.

## Considered Options

- **El XLSX de Hacienda tal cual:** es la fuente que valida los Comprobantes electrónicos, pero está congelado
  en 2022 y le faltan Pijije y Cabagra, que son criterio de aceptación explícito. Da 492.
- **Hacienda más los dos distritos nuevos:** llega a 494 y es lo que suponía el #54, pero arrastra la
  renumeración de Grecia y deja el catálogo sin fuente cartográfica: los nombres serían los de un archivo
  administrativo, en mayúsculas en varias filas y con un «hasta ser publicado en La Gaceta» dentro de un
  nombre.
- **El IGN tal cual:** es la fuente oficial de la división territorial y la que nombra bien, pero da 493 y
  dejaría fuera un distrito que existe, con lo que una Dirección real de Duacarí no se podría capturar.
- **Esperar a que el IGN corrija la tabla:** bloquearía la captura de Direcciones por un erratum ajeno y sin
  fecha.

## Consequences

- El catálogo **no es citable como «la lista del IGN» ni «la de Hacienda»**: es una composición. Por eso el dato
  de origen se revisa en el repo (`data/dta-2026.tsv`) y el generador comprueba los conteos, en vez de
  descargarse de una URL en tiempo de compilación.
- **Los códigos de Grecia son los del IGN**, con el `20306` vacío desde que Río Cuarto pasó a ser cantón:
  `20307` Puente de Piedra y `20308` Bolívar. Hacienda usa `20306` y `20307` para esos mismos distritos. Como
  `districtCode` viaja a Correos como código postal, se prefirió el que corresponde a la cartografía; emitir
  Comprobantes electrónicos exigirá mapear los siete distritos de Grecia.
- Los nombres conservan el artículo que el IGN escribe y Hacienda suelta (`La Fortuna`, `Las Horquetas`,
  `El Rosario`), y `21303` queda como lo escribe el IGN, `San José O Pizote`, con la O en mayúscula.
- `dtaVersion` congela `DTA-2026` en cada Dirección y cada Pedido, así que una DTA-2027 no reescribe lo ya
  guardado: se añade un catálogo nuevo y lo viejo sigue leyéndose con su versión.
- Cambiar esta decisión —adoptar los códigos de Hacienda— obligaría a migrar los `districtCode` ya guardados de
  los siete distritos de Grecia, no solo a regenerar el JSON.
