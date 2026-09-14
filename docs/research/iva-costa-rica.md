# IVA de Costa Rica y el precio de un producto

> Investigación para el ticket [#47](https://github.com/Darkmixt12/ws-steven-munoz/issues/47) del mapa [#35](https://github.com/Darkmixt12/ws-steven-munoz/issues/35).
> Fecha de consulta: 2026-09-14. Contexto: tienda online pequeña de bienes físicos, solo Costa Rica, solo venta online.

## Pregunta

¿Qué reglas del IVA de Costa Rica afectan al precio de un producto en una tienda online?

1. Tarifas vigentes (general, reducidas, exentos, canasta básica).
2. ¿Hay que mostrar al consumidor el precio final con impuestos incluidos?
3. ¿La tarifa depende del producto (código CABYS)? ¿Cómo se determina?
4. Reglas de redondeo y decimales en CRC.

## Fuentes primarias usadas

| Id | Fuente | URL |
|---|---|---|
| L9635 | Ley 9635, Fortalecimiento de las Finanzas Públicas (título I = Ley del IVA, Ley 6826 reformada). Texto completo del SCIJ, impresión del 18/12/2024, publicado por ICODER | https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf |
| DGT-IVA | Dirección General de Tributación: "Ley y Reglamento Impuesto sobre el Valor Agregado (IVA)" (resumen oficial, período fiscal 2021) | https://www.hacienda.go.cr/docs/ImpuestoalValorAgregado29012021.pdf |
| RLIVA | Reglamento de la Ley del IVA, Decreto 41779-H (SCIJ) | https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=88953&nValor3=116520&strTipM=TC |
| CE44 | Ministerio de Hacienda (DGT): "Anexos y Estructuras para la Emisión de Comprobantes Electrónicos, versión 4.4", noviembre 2024 | https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf |
| MEIC-OC | MEIC: "Obligaciones del comerciante" (cita el art. 34 de la Ley 7472) | https://www.meic.go.cr/meic/direcciones/apoyo-al-consumidor/educacion-al-consumidor/obligaciones-del-comerciante/ |
| R7472 | Reglamento a la Ley 7472, Decreto 37899-MEIC, texto completo del SCIJ con reformas hasta el Decreto 44400 (26/02/2024), impresión del 01/07/2026, publicado por MICITT | https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf |
| BCCR-CABYS | Banco Central de Costa Rica: Catálogo de Bienes y Servicios (CABYS) | https://www.bccr.fi.cr/indicadores-economicos/cat%C3%A1logo-de-bienes-y-servicios |

No se pudo abrir el texto consolidado del SCIJ ni del Reglamento del IVA: `pgrweb.go.cr` redirige a `sinalevi.go.cr` y esa página solo devuelve la navegación. Tampoco se pudieron descargar los PDF del BCCR, que bloquea las descargas automáticas. Cuando una afirmación depende de esas fuentes, o de fuentes secundarias, va marcada con ⚠️.

---

## 1. Tarifas de IVA

### Tarifa general: 13 %

> "Artículo 10- Tarifa del impuesto. La tarifa del impuesto es del trece por ciento (13%) para todas las operaciones sujetas…" ([L9635, art. 10](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf))

Cualquier bien físico que no esté en una tarifa reducida ni en una exención paga el 13 %.

### Tarifas reducidas (art. 11 de la Ley del IVA)

Fuente: [L9635, art. 11](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf). Resumen oficial en [DGT-IVA](https://www.hacienda.go.cr/docs/ImpuestoalValorAgregado29012021.pdf), que remite al art. 23 del Reglamento.

| Tarifa | Bienes o servicios (resumen) | ¿Relevante para una tienda de bienes físicos? |
|---|---|---|
| **4 %** | Pasajes aéreos (sobre el 10 % del valor en boletos internacionales); servicios de salud privados | No |
| **2 %** | Medicamentos y sus materias primas, insumos, maquinaria, equipo y reactivos; educación privada; primas de seguros personales; compras y ventas de las universidades estatales | Solo si se venden medicamentos |
| **1 %** | Bienes de la **canasta básica** (incluidos los agropecuarios de la canasta); algunas materias primas para alimento animal (trigo, soya, sorgo, palma, maíz); productos veterinarios e insumos agropecuarios y de pesca no deportiva | Sí, si se venden bienes de la canasta (p. ej. útiles o calzado escolar bajo el tope de precio) |
| **0,5 %** | Productos agropecuarios o agroindustriales **orgánicos** registrados y certificados, y equipo e insumos para producirlos | Poco probable |

- **Canasta básica:** la ley dice que la canasta "se definirá" por decreto conjunto del Ministerio de Hacienda y el MEIC, a partir del consumo de los hogares de los primeros deciles de ingreso ([L9635, art. 11 inc. 3.b](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf)). El resumen de Hacienda de 2021 cita el Decreto 41615-MEIC-H ([DGT-IVA](https://www.hacienda.go.cr/docs/ImpuestoalValorAgregado29012021.pdf)).
  - ⚠️ **Incierto:** según fuentes secundarias, la lista vigente es la del **Decreto 43790-H-MEIC-S** (La Gaceta, 11/11/2022), aplicada desde el 01/02/2023, con más de 250 bienes. Algunos bienes de la lista, como el calzado escolar, tienen un tope de precio ([EY](https://www.ey.com/es_ce/technical/tax/tax-alerts/costa-rica-nuevo-listado-de-bienes-y-productos-que-integran-la-canasta-basica), [aDiarioCR](https://adiariocr.com/economia/toallas-sanitarias-bultos-y-calzado-escolar-estan-incluidos-en-canasta-basica/)). No se consultó el decreto en el SCIJ.
- **0,5 %:** la tarifa existe en los códigos oficiales de Hacienda: código `09`, "Tarifa reducida 0.5%" ([CE44, nota 8.1](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)).
  - ⚠️ Que venga de la **Ley 10.256** (La Gaceta, 29/09/2022), que agregó un inciso 4 al art. 11 para productos orgánicos, se confirmó solo con fuentes secundarias ([EY](https://www.ey.com/es_ce/technical/tax/tax-alerts/costa-rica-productos-agropecuarios-y-agroindustriales-organico-tendran-una-tarifa)). El texto del SCIJ de 2024 que se consultó no mostraba ese inciso en el extracto.

### Exenciones y otras tarifas cero

- El **art. 8** de la Ley del IVA enumera las exenciones ([L9635, art. 8](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf)). Casi todas son operaciones o sujetos específicos (exportaciones, ciertos servicios, etc.), no bienes de consumo corriente.
- En el comprobante electrónico se distinguen ([CE44, nota 8.1](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)):
  - `01` "Tarifa 0% (Artículo 32, num 1, RLIVA)": ventas con derecho a crédito, p. ej. a la CCSS o a municipalidades.
  - `10` "Tarifa Exenta" (Ley 9635, art. 8).
  - `11` "Tarifa 0% sin derecho a crédito": no sujetos.

  Las tres dependen **de la operación o del comprador**, no solo del producto.

### Tabla oficial de códigos de tarifa IVA

Esta es la tabla que usa el comprobante electrónico ([CE44, nota 8.1](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)):

| Código | Tarifa |
|---|---|
| 01 | Tarifa 0 % (art. 32, num. 1, RLIVA) |
| 02 | Tarifa reducida 1 % |
| 03 | Tarifa reducida 2 % |
| 04 | Tarifa reducida 4 % |
| 05 | Transitorio 0 % (solo notas de crédito y débito) |
| 06 | Transitorio 4 % (solo notas de crédito y débito) |
| 07 | Tarifa transitoria 8 % (inhabilitado; solo notas de crédito y débito) |
| 08 | **Tarifa general 13 %** |
| 09 | Tarifa reducida 0,5 % |
| 10 | Tarifa exenta |
| 11 | Tarifa 0 % sin derecho a crédito |

### ¿Siguen vigentes estas tarifas? (verificado al 2026-09-14)

- El texto de la ley en el SCIJ (impresión del 18/12/2024) mantiene el 13 % general y las tarifas reducidas descritas arriba ([L9635](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf)).
- Las tarifas transitorias de la reforma, como el 4 % y el 8 % para servicios turísticos o de ingeniería, **ya terminaron**: todas llegaron al 13 % a más tardar en 2023 ([DGT-IVA](https://www.hacienda.go.cr/docs/ImpuestoalValorAgregado29012021.pdf)). Por eso los códigos 05, 06 y 07 solo sirven para notas de crédito y débito ([CE44](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)).
- ⚠️ **Incierto:** en julio de 2026 el Gobierno **evaluaba** revisar la canasta básica, e incluso gravarla al 13 %. Para eso hace falta una ley aprobada por la Asamblea Legislativa, y a esa fecha no la había ([Infobae, 06/07/2026](https://www.infobae.com/costa-rica/2026/07/06/gobierno-de-costa-rica-evalua-revisar-la-canasta-basica-tributaria-con-iva-reducido-del-1/), fuente secundaria). No se pudo confirmar en el SCIJ si hubo cambios entre julio y septiembre de 2026.
  - **Consecuencia para el diseño:** las tarifas **pueden cambiar**, así que el modelo no debe tenerlas fijas en el código.

---

## 2. ¿Hay que mostrar el precio final con IVA incluido?

**Sí.** Las normas de protección al consumidor obligan a mostrar el precio final con todos los impuestos. En comercio electrónico, además, hay que informar el precio total con los costos adicionales (envío incluido) y dar el desglose.

- **Ley 7472, art. 34 (obligaciones del comerciante):** el comerciante debe informar "en español y de manera clara y veraz" sobre lo que incide en la decisión de consumo, incluido "el precio de contado en el empaque, el recipiente, el envase o la etiqueta del producto y la góndola o el anaquel" ([MEIC-OC](https://www.meic.go.cr/meic/direcciones/apoyo-al-consumidor/educacion-al-consumidor/obligaciones-del-comerciante/)).
- **Reglamento 37899-MEIC, definición:**

  > "Precio final: Es el precio que efectivamente va a pagar el consumidor por el bien o el servicio adquirido, el cual incluye todos los impuestos, cargas, comisiones u otros cargos cuando corresponda." ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf))

- **Reglamento 37899-MEIC, art. 36 ("Sobre los precios"; antes art. 93, renumerado por el Decreto 44400 de 2024):**

  > "Los precios de los bienes y servicios deberán estar indicados de manera que no quede duda del monto final [que] incluye todos los impuestos, las cargas, o comisiones cuando correspondan."

  Si el precio se ofrece en moneda extranjera, hay que informar que se aplica el tipo de cambio de referencia de venta del BCCR ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)).
- **Reglamento 37899-MEIC, art. 187 ("Información sobre el precio", capítulo de comercio electrónico):**
  - El comerciante debe informar "de forma clara y fácilmente visible, sobre el precio total de los bienes o servicios, el cual incluirá el precio y los costes adicionales".
  - Esos costes son "los tributos, los gastos de transporte, entrega, servicios postales y cualquier otra comisión, cargo, gasto o erogación adicional".
  - Además: "El comerciante deberá brindar, en todos los casos, **un desglose de los rubros incluidos en el precio total**" ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)).
- **Reglamento 37899-MEIC, art. 181:** incumplir el capítulo de comercio electrónico se considera una infracción al art. 34 de la Ley 7472 ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)).
- **Reglamento 37899-MEIC, art. 197 (publicidad):** también la publicidad debe informar el precio final, "incluidos todos los rubros que lo componen", y los costos de envío ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)).
- El mismo reglamento cita expresamente "la inclusión de los impuestos correspondientes en el precio final" entre los asuntos de información básica al consumidor que el MEIC puede prevenir ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)).

⚠️ El art. 187 exige un "desglose de los rubros". No se encontró si ese desglose debe mostrar el IVA por separado o si basta con separar producto y envío. Lo prudente es mostrar en el checkout subtotal, envío, IVA incluido y total.

---

## 3. ¿La tarifa depende del producto? El papel del CABYS

### Qué dice la ley

La tarifa se determina **por ley**, según la naturaleza del bien (arts. 10 y 11) y, en algunos casos, según la operación o el comprador (art. 8 y RLIVA art. 32) ([L9635](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf); [CE44, nota 8.1](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)). Para la canasta básica, la tarifa depende de que el bien esté en el decreto vigente.

### Qué es el CABYS

- Es el Catálogo de Bienes y Servicios que mantienen el BCCR y el Ministerio de Hacienda ([BCCR-CABYS](https://www.bccr.fi.cr/indicadores-economicos/cat%C3%A1logo-de-bienes-y-servicios)).
- Clasifica bienes y servicios de forma jerárquica, desde 10 categorías generales hasta más de 20 000 códigos.
- ⚠️ Los datos sobre el CABYS 2025 salen de resultados de búsqueda del sitio del BCCR, no del PDF, que no se pudo abrir ([CP-BCCR-015-2025](https://www.bccr.fi.cr/comunicacion-y-prensa/Docs_Comunicados_Prensa/CP-BCCR-015-2025-Actualizacion_Catalogo_Bienes_Servicios_Cabys_2025.pdf)):
  - La versión **CABYS 2025** se publicó el 01/04/2025.
  - Hubo un período de transición hasta el 01/06/2025.

### El código CABYS es obligatorio en la factura

- En la factura electrónica v4.4, el campo `CodigoCABYS` de cada `LineaDetalle` es **obligatorio en todos los comprobantes**. La única excepción son ciertos casos del nodo "Otros Cargos" sin línea de producto ([CE44](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)).
- Los códigos CABYS que empiezan por 0 a 4 son **bienes** ([CE44](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)).
- Cada línea lleva el código de tarifa IVA (nota 8.1) y el porcentaje. Para el código de impuesto 01 (IVA), "la tarifa del impuesto debe de coincidir con el correspondiente código de impuesto IVA, caso contrario se rechazará" ([CE44](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)).

### ⚠️ Tarifa del catálogo frente a tarifa aplicada

Fuentes secundarias indican que el catálogo CABYS muestra una tarifa de IVA para cada código ([siemprealdia](https://siemprealdia.co/costa-rica/impuestos/codigos-cabys-costa-rica/)). No se pudo leer en fuente primaria si esa tarifa es **vinculante o solo de referencia**: el documento de preguntas frecuentes del BCCR está bloqueado.

Hay dos razones para no tomarla como automática:

- La ley, no el catálogo, fija la tarifa.
- Hay tarifas que dependen del comprador o de la operación (códigos 01, 10 y 11).

**En resumen:** el producto tiene un código CABYS, y del CABYS se obtiene normalmente la tarifa. Pero la tarifa aplicada es la que manda la ley en la fecha de la venta.

---

## 4. Redondeo y decimales

- **No se encontró una norma que exija precios al consumidor en colones enteros ni una regla de redondeo para ellos.**
  - En el texto completo del Reglamento 37899-MEIC no aparecen "redondeo" ni "céntimo" ([R7472](https://www.micitt.go.cr/sites/default/files/marco_juridico_legal/03.%20Decreto%20Ejecutivo%20n.%C2%B0%2037899-MEIC%20Reglamento%20a%20la%20Ley%20de%20Promoci%C3%B3n%20de%20la%20Competencia%20y%20Defensa%20Efectiva%20del%20Consumidor%20n.%C2%B0%207472..pdf)).
  - Tampoco en el extracto consultado de la Ley del IVA ([L9635](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf)).
- **El comprobante electrónico sí trabaja con decimales** ([CE44](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)):
  - Los montos (`PrecioUnitario`, `MontoTotal`, `SubTotal`, `BaseImponible`, monto de impuesto, `MontoTotalLinea`, totales) son `Decimal 18,5`: "13 enteros y 5 decimales".
  - La cantidad usa 3 decimales.
  - El separador decimal es el punto.
  - Regla de redondeo a 5 decimales mirando el sexto decimal: "20.203512 → 20.20351" y "20.203518 → 20.20352", es decir, redondeo al más cercano, con la mitad hacia arriba.
- **Cómo se calcula una línea de factura** ([CE44](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/ANEXOS%20Y%20ESTRUCTURAS_V4.4.pdf)):
  1. `MontoTotal` = cantidad × precio unitario.
  2. `SubTotal` = monto total − descuento. Se admiten hasta 5 descuentos por línea, en cascada.
  3. Monto IVA = tarifa × base imponible.
  4. `MontoTotalLinea` = subtotal + impuesto neto.

  Es decir, **el precio unitario de la factura va sin IVA** y el IVA se suma después.
- **Base imponible:** en la venta de bienes el IVA se calcula sobre el precio neto de venta ([L9635, art. 12](https://www.icoder.go.cr/fileadmin/documentos/tramites/caja_de_herramientas/leyes_y_sus_reglamentos/Ley_N__9635_de_Fortalecimiento_de_las_Finanzas_P%C3%BAblicas.pdf)).
  - No forman parte de la base "los descuentos aceptados en las prácticas comerciales, siempre que sean usuales y generales, y se consignen por separado" en la factura.
  - Tampoco "el valor de los servicios que se presten con motivo de las ventas de bienes gravados, siempre que sean suministrados y facturados por separado". El envío, por ejemplo, se factura aparte y tributa por su cuenta (inferencia).
  - Las devoluciones reducen la base.
- **Monedas:** ⚠️ según resultados de búsqueda del sitio del BCCR, la moneda de menor denominación es la de ₡10 y las de ₡5 salen de circulación. No se pudo abrir el comunicado ([CP-BCCR-016-2025](https://www.bccr.fi.cr/comunicacion-y-prensa/Docs_Comunicados_Prensa/CP-BCCR-016-2025-Emision_nueva_moneda_10_colones.pdf)). Una tienda solo online con pago electrónico no depende de esto.

### Ejemplo: precio entero con IVA incluido

| Concepto | Monto |
|---|---|
| Precio mostrado (13 %, IVA incluido) | ₡10 000 |
| Base imponible = 10 000 / 1,13 | 8 849,55752 |
| IVA = 8 849,55752 × 0,13 | 1 150,44248 |
| Total de la línea | 10 000,00000 |

Un precio final entero en colones es válido. El desglose base/IVA **sí tiene céntimos** y se expresa con 5 decimales en la factura.

- ⚠️ No se verificó qué tolerancia de redondeo aplica Hacienda al validar un comprobante cuya base se obtiene dividiendo un precio con IVA incluido.
- ⚠️ No se verificó cómo se comporta el cálculo con varias unidades por línea. Por ejemplo, 3 × 8 849,55752 = 26 548,67256, cuyo IVA es 3 451,32743 (redondeado), y el total da 29 999,99999 en vez de 30 000.

  Este descuadre de ₡0,00001 lo suele resolver el proveedor de factura electrónica, calculando el precio unitario con más cuidado o ajustando. Hay que confirmarlo con el proveedor que se elija, aunque elegirlo está fuera de este mapa.

---

## Implicaciones para el modelo de dominio

### Producto (`products`)

- **Precio en CRC entero, con IVA incluido (precio final).** Es viable y coincide con lo que la norma obliga a mostrar (R7472 arts. 36 y 187). No se encontró norma que obligue a usar céntimos en el precio al consumidor.
- **Código CABYS** (13 dígitos, como string): obligatorio para facturar cada línea (CE44). Pertenece al Producto porque describe su naturaleza.
- **Tarifa de IVA:** guardarla explícitamente como código de tarifa de Hacienda (`08` = 13 %, `02` = 1 %, etc.) o como porcentaje, y no calcularla en tiempo de ejecución.
  - Normalmente se deriva del CABYS y de la ley (canasta básica), pero puede cambiar por reformas (⚠️ debate de 2026 sobre la canasta).
  - Para una tienda pequeña de bienes físicos, casi todo será 13 %.
- No hace falta guardar un "precio sin IVA" en el Producto: se deriva del precio final y la tarifa. Guardar ambos crea el riesgo de que no cuadren.

### Línea de Pedido (`orders[].lines` o subcolección)

Debe guardar una **copia congelada** (snapshot) de lo que se aplicó en la venta, porque la tarifa y el precio del Producto pueden cambiar después:

- `unitPrice`: precio unitario final con IVA, en CRC entero.
- `quantity`.
- `cabysCode`.
- `taxRateCode` y/o `taxRatePercent`.
- `lineDiscount`: monto de descuento de la línea, en CRC entero.
- `lineTotal`: total de la línea con IVA, en CRC entero.

**Desglose base/IVA:** tiene decimales (hasta 5 en el comprobante). Hay dos opciones:

- **(a)** No guardarlo en Firestore y dejar que lo calcule la integración de factura electrónica a partir de los datos de la línea.
- **(b)** Guardarlo como `number` con decimales, solo informativo.

En ambos casos, **el monto que el Cliente paga sigue siendo un entero en CRC**. El tipo `number` (double) de Firestore representa sin problema montos de una tienda pequeña con 5 decimales.

### Envío

- Debe ir como **cargo aparte** en el Pedido.
- Se incluye en el precio total que se informa (R7472 art. 187).
- Tiene su propia tarifa de IVA: si lo presta la tienda, es un servicio gravado al 13 % (inferencia de los arts. 10 y 12).
- En la factura va como línea de servicio con CABYS de servicio, o en "Otros cargos" (CE44).

### Descuentos

- Para no gravarlos, los descuentos deben **consignarse por separado** en la factura (L9635 art. 12).
- En la factura electrónica, el descuento va **por línea** (`LineaDetalle > Descuento`) (CE44).
- Si el Pedido solo tiene un descuento global, habrá que **prorratearlo entre las líneas** para facturar. Si las líneas tienen tarifas distintas, el reparto cambia el IVA.
- Por eso conviene que el descuento quede registrado por línea, como ya prevé el mapa ("monto de descuento por línea y total"), y no solo como total.

### Devoluciones

Las devoluciones reducen la base imponible (L9635 art. 12). En la factura se corrigen con una nota de crédito electrónica, que exige el mismo CABYS (CE44). La línea de Pedido congelada es la que permite emitirla.

### Tarifas en la configuración

No escribir el 13 % en el código. Las tarifas deben leerse de configuración o del Producto, porque la ley puede cambiar (⚠️ debate sobre la canasta básica en 2026).
