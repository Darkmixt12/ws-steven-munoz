# Factura electrónica de Hacienda para una tienda online pequeña (Costa Rica)

> Ticket: [#46](https://github.com/Darkmixt12/ws-steven-munoz/issues/46) · Mapa: [#35](https://github.com/Darkmixt12/ws-steven-munoz/issues/35)
> Investigado: 2026-09-14 · Alcance: qué debe **dejar previsto** el modelo de datos (Pedido, línea de Pedido, Cliente, Producto). Elegir proveedor de facturación **no** es parte de este documento.

## Fuentes primarias usadas

| # | Fuente | Fecha | URL |
|---|--------|-------|-----|
| R | Decreto Ejecutivo N.º 44739-H, *Reglamento de Comprobantes Electrónicos para efectos tributarios* (deroga el 41820-H) | firmado 02/10/2024, publicado 08/11/2024 | https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf |
| RES | Resolución MH-DGT-RES-0027-2024, *Disposiciones técnicas de los comprobantes electrónicos* | dictada 13/11/2024, publicada 19/11/2024 | https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf |
| AX | *Anexos y Estructuras para la Emisión de Comprobantes Electrónicos, versión 4.4* (con "Bitácora de ajustes al 22/04/2026") | nov. 2024, actualizado 22/04/2026 | https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf |
| XSD | Esquemas XML v4.4 (Factura y Tiquete) publicados por Hacienda | 2024, v4.4 | https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/FacturaElectronica_V4.4.xsd · https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/TiqueteElectronico_V4.4.xsd (índice: https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/frmAnexosyEstructuras.aspx) |
| DGT | Presentación DGT *Comprobantes Electrónicos y Versión 4.4* | marzo 2025 | https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf |
| CP08 | Comunicado de prensa CP-08-2025 (prórroga v4.4 al 01/09/2025) | 11/02/2025 | https://www.hacienda.go.cr/docs/CP08-TRIBUTACION_AMPLIA%20PLAZO_PARA_IMPLEMENTAR_CAMBIOS_EN_COMPROBANTES_ELECTRONICOS.pdf |
| TRIBU | Avisos TRIBU-CR (TICOFACTURA, pagos desde el 06/10) | 2025 | https://www.hacienda.go.cr/AvisosTRIBU-CR.html |
| RTS | Hojas informativas DGT del Régimen de Tributación Simplificada (requisitos y actividades) | sin fecha visible | https://www.hacienda.go.cr/docs/RequisitosParaOptarPorElRegimenTributacionSimplificada.pdf · https://www.hacienda.go.cr/docs/ActividadesQuePuedenOptarPorElRTS.pdf |

Fuente secundaria (usada solo donde se indica y marcada ⚠️): KPMG Costa Rica, *Newsflash* 8 de mayo 2026 — https://kpmg.com/cr/es/insights/2026/05/newsflash-may-8.html

Convención: **⚠️ Incierto** = no verificado en fuente primaria, o es inferencia propia.

---

## 1. ¿Está obligada la tienda a emitir comprobantes electrónicos?

- **Regla general: sí.** Están obligados "los contribuyentes indicados en el artículo 2 de la Ley del Impuesto sobre la Renta y 4 de la Ley del Impuesto sobre el Valor Agregado" ([R, art. 3](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)). Una tienda que vende bienes gravados con IVA en régimen tradicional es **emisor-receptor electrónico** y debe emitir, enviar a Hacienda y conservar los comprobantes ([R, art. 4 inciso 1](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
- **Excepción, el Régimen de Tributación Simplificada (RTS):** los inscritos en el RTS **no están obligados**, "salvo aquellos que hayan optado por registrarse como emisor receptor electrónico no confirmante" ([R, art. 7.1](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)). En ese caso deben "emitir y entregar los respectivos comprobantes electrónicos **cuando así lo solicite el cliente**" ([R, art. 4.2.f](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf); [R, art. 18](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
- **¿Puede una tienda online estar en el RTS?** El "comercio minorista" puede optar: "vende a consumidores finales mercancía… en un local acondicionado **o cualquier otro mecanismo**" (excepto celulares y accesorios) ([RTS actividades](https://www.hacienda.go.cr/docs/ActividadesQuePuedenOptarPorElRTS.pdf)). Los requisitos se cumplen **todos a la vez**: compras anuales ≤ 186 salarios base; como máximo 5 empleados; **un único establecimiento abierto al público**; activos fijos ≤ 350 salarios base ([RTS requisitos](https://www.hacienda.go.cr/docs/RequisitosParaOptarPorElRegimenTributacionSimplificada.pdf)).
  - ⚠️ **Incierto:** no encontré en fuente primaria si una tienda *solo online* cumple "establecimiento abierto al público". Las hojas RTS no tienen fecha y el salario base que citan puede estar desactualizado. El régimen de la tienda es una decisión tributaria del dueño o su contador, no del modelo.
- **Conclusión para el modelo:** hay que diseñar para el caso **régimen tradicional**, donde se emite siempre. El caso RTS con emisor no confirmante (emitir solo si el cliente lo pide) es un subconjunto: el mismo modelo sirve con "comprobante opcional".

## 2. Tiquete electrónico vs. factura electrónica en venta a consumidor final

- **Tiquete electrónico (código 04):** "autorizado… **únicamente para operaciones con consumidores finales**, el cual **no puede ser utilizado para justificación de gastos o créditos** a nivel tributario" ([R, art. 2.25](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
- **Factura electrónica (código 01):** "respalda la venta de bienes y la prestación de servicios" ([R, art. 2.12](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)). Es la que sirve al comprador contribuyente para respaldar gastos y créditos de IVA ([RES, art. 11](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)).
- **En la práctica, para esta tienda:**
  - Consumidor final anónimo o que no pide factura → **Tiquete**.
  - Comprador que se identifica y quiere respaldar el gasto (empresa o profesional) → **Factura electrónica**, con receptor identificado.
  - ⚠️ **Inferencia:** no hallé un artículo que diga literalmente "si el cliente pide factura, se debe emitir FE en lugar de tiquete" para el régimen tradicional. Se deduce de que el tiquete no respalda gastos (art. 2.25) y de que el emisor debe "emitir, entregar y recibir" comprobantes "para el respaldo de créditos y gastos" (art. 4.1.g).
- Otros tipos relevantes: **Nota de crédito electrónica (03)** para anular o devolver; **Nota de débito (02)**; **Recibo Electrónico de Pago (10)**, que solo aplica a ventas a crédito con pago diferido ([R, art. 2.23](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf); [AX, nota 5](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)). Una tienda online de contado no lo necesita.

## 3. Datos del receptor (cliente) que exige cada comprobante

Verificado en los XSD v4.4:

| Campo del receptor | Tiquete (TE) | Factura (FE) | Notas |
|---|---|---|---|
| Nodo `Receptor` completo | **Opcional** (`minOccurs="0"`) | **Obligatorio** | [XSD TE](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/TiqueteElectronico_V4.4.xsd), [XSD FE](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/FacturaElectronica_V4.4.xsd) |
| `Nombre` (3–100 caracteres) | Obligatorio *si* se incluye el receptor | Obligatorio | XSD |
| `Identificacion` (`Tipo` + `Numero`) | Opcional | **Obligatorio** | XSD. En FE y TE Hacienda verifica "que el número de identificación sea un dato real en los padrones" ([AX, p. 22–23](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)) |
| `Ubicacion` (provincia, cantón, distrito, barrio, otras señas) | Opcional | En el XSD es opcional. Según AX: "en caso de contar con domicilio en el país, **debe indicarse**" (condicional) | [AX, p. 23](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf). Solo admite códigos numéricos del catálogo `Codificacionubicacion_V4.4` ([AX, nota 14](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)). `OtrasSenas`: 5–160 caracteres |
| `CorreoElectronico` | Opcional | Condicional ("obligatoria, cuando el cliente lo requiera") | XSD. Hasta 160 caracteres con formato validado |
| `Telefono` | Opcional | Opcional | 8–20 dígitos + código de país ([AX](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)) |
| `CodigoActividadReceptor` (6 caracteres) | — | Opcional ("cuando se requiera") | [XSD FE](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/FacturaElectronica_V4.4.xsd); ajuste del 22/04/2026 ⚠️ según KPMG |

**Tipos de identificación** ([AX, nota 4](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)):

| Código | Tipo | Formato |
|---|---|---|
| 01 | Cédula física | 9 dígitos, sin cero inicial ni guiones |
| 02 | Cédula jurídica | 10 caracteres, sin guiones |
| 03 | DIMEX | 11 o 12 dígitos |
| 04 | NITE | 10 dígitos |
| 05 | Extranjero no domiciliado | hasta 20 caracteres alfanuméricos. Permitido en TE; en FE solo con condición de venta 12 (mercancía no nacionalizada) |
| 06 | No contribuyente | solo factura de compra |

- **Cambio 2026:** la bitácora del 22/04/2026 aclara que el número de identificación de personas jurídicas **admite caracteres alfanuméricos**, "en concordancia con las disposiciones del Registro Nacional" ([AX, Bitácora 22/04/2026, punto 1](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)). KPMG da el ejemplo `3-101-A00001`. **La identificación debe guardarse como texto, nunca como número.**
- **Entrega del comprobante:** debe entregarse "en el mismo acto de la compraventa", ya sea por "envío por correo electrónico o puesta a disposición por algún otro medio electrónico autorizado por el cliente" ([RES, art. 5](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf); [R, art. 2.11 y 18](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)). Aunque el tiquete no lleve receptor, **la tienda necesita un correo de contacto para entregarlo**.

## 4. Versión vigente, clave, consecutivo, CABYS y plazos

### 4.1 Versión vigente (a 2026-09-14)

- **v4.4 es obligatoria desde el 01/09/2025.** "Rige a partir del 01 de setiembre del 2025, a partir de dicha fecha se deroga la Versión 4.3" ([AX, p. 3](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf); [CP08](https://www.hacienda.go.cr/docs/CP08-TRIBUTACION_AMPLIA%20PLAZO_PARA_IMPLEMENTAR_CAMBIOS_EN_COMPROBANTES_ELECTRONICOS.pdf)). La prórroga desde el plazo original de seis meses ([RES, Transitorio I](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)) la dio la MH-DGT-RES-0001-2025 ([DGT, lámina "Fundamento legal"](https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf)).
- **Actualización del 22/04/2026** dentro de la misma v4.4: identificaciones alfanuméricas, excepción para teléfonos especiales, nuevos códigos de referencia 13–17 y 19–20 ([AX, bitácora](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).
  - ⚠️ **Incierto:** la fecha de uso **obligatorio el 01/11/2026** solo la encontré en fuentes secundarias ([KPMG](https://kpmg.com/cr/es/insights/2026/05/newsflash-may-8.html) y proveedores). No localicé el aviso oficial de Hacienda.
- **TRIBU-CR** es la nueva plataforma tributaria. Hacienda anunció el facturador gratuito **TICOFACTURA** "disponible a partir del 06 de octubre" de 2025 ([TRIBU](https://www.hacienda.go.cr/AvisosTRIBU-CR.html)). La **estructura** de los comprobantes sigue siendo la v4.4 de los Anexos; TRIBU-CR no introdujo otro formato. Los esquemas se siguen publicando en el sitio ATV ([índice XSD](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/frmAnexosyEstructuras.aspx)).
  - ⚠️ No verifiqué en fuente primaria la fecha exacta de arranque de TRIBU-CR (06/10/2025) ni el apagado de ATV. Esa información viene de resúmenes de búsqueda.
- **QR en la representación gráfica:** exigido en el art. 4 de la resolución, pero **suspendido** "hasta que la Dirección General de Tributación lo informe" ([RES, Transitorio III](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)).

### 4.2 Consecutivo (20 dígitos)

Estructura según [AX, nota 3](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf):

| Posiciones | Contenido |
|---|---|
| 1–3 | Sucursal (`001` = casa matriz) |
| 4–8 | Terminal (`00001` si hay un solo servidor centralizado) |
| 9–10 | Tipo de comprobante: 01 FE · 02 ND · 03 NC · 04 TE · 05–07 mensajes de confirmación · 08 FEC · 09 FEE · 10 REP |
| 11–20 | Número, desde 1 |

- Debe asignarse "de forma automática y **estrictamente consecutiva**… para cada tipo de documento… **sin saltos**" ([R, art. 13.4](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf); [RES, art. 2](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)).
- Si se cambia de plataforma de emisión, se mantiene la numeración ([AX, nota 3](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).

### 4.3 Clave numérica (50 dígitos)

Estructura según [AX, nota 3](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf) y [RES, art. 3](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf):

| Posiciones | Contenido |
|---|---|
| 1–3 | `506` |
| 4–9 | Día, mes y año (DDMMAA) |
| 10–21 | Cédula del emisor, rellenada a 12 posiciones |
| 22–41 | Consecutivo (20) |
| 42 | Situación: `1` normal · `2` contingencia · `3` sin internet |
| 43–50 | Código de seguridad generado por el sistema |

- Nombres de archivo: `clave.xml`, `clave_respuesta.xml` (respuesta de Hacienda) y `clave.pdf` ([AX, nota 3](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).

### 4.4 CABYS por línea: sí, obligatorio

- `CodigoCABYS` es obligatorio en cada `LineaDetalle` de FE y TE: exactamente **13 caracteres** en ambos XSD ([XSD TE](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/TiqueteElectronico_V4.4.xsd), [XSD FE](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/FacturaElectronica_V4.4.xsd)). Hacienda valida "que el código sea válido en el catálogo vigente publicado en el sitio web del BCCR"; es obligatorio desde el 01/12/2020 ([AX, p. 26 y nota 17](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).
- Otros campos por línea ([AX, sección b](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)):
  - `Cantidad`: decimal 16,3, mayor que 0.
  - `UnidadMedida`: catálogo de la nota 15.
  - `Detalle`: descripción.
  - `PrecioUnitario`: decimal 18,5.
  - `CodigoComercial`: SKU/GTIN, opcional; obligatorio en combos o surtidos CABYS.
  - Descuento: monto + código según nota 20.
  - Impuesto: código 01 IVA + `CodigoTarifaIVA` según nota 8.1 (p. ej. `08` = 13 % general; `02`/`03`/`04` = reducidas 1/2/4 %; `10` = exenta).
  - `ImpuestoNeto` y `MontoTotalLinea`.
- El comprobante debe mostrar el **precio neto sin IVA** y el monto de impuesto por cada tarifa ([R, art. 13 incisos 14–15](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
- **Precisión numérica:** los montos del XML son decimales con hasta 5 cifras decimales, separador punto y regla de redondeo definida ([AX, p. 14](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).

### 4.5 Resumen del comprobante

- `CodigoMoneda` es obligatorio en todos los comprobantes. Con **CRC, `TipoCambio` = 1** ([AX, p. 50](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).
- `MedioPago` se registra en el resumen, **hasta 4 medios**, con monto por medio cuando hay más de uno ([AX, p. 55](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)). Códigos de la [nota 6](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf): 01 efectivo · 02 tarjeta · 03 cheque · 04 transferencia/depósito · 05 recaudado por terceros · **06 SINPE Móvil** · **07 plataforma digital** · 99 otros.
- `CondicionVenta` (nota 5): **01 contado** para una tienda online prepagada.

### 4.6 Plazos, validación y correcciones

- **Emisión:** "en el mismo acto de la compraventa". La fecha de emisión la asigna el sistema y **no puede ser anterior ni posterior** ([R, art. 2.6, 13.6, 14.7](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
  - ⚠️ **Incierto:** las fuentes no definen cuál es "el acto de compraventa" en comercio electrónico (¿confirmación del pago? ¿despacho?). Supuesto razonable a validar con un contador: emitir al confirmarse el pago.
- **Envío a Hacienda:** "de forma inmediata y automatizada" ([R, art. 21](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
  - Sin internet: se genera en el acto (situación `3`) y se envía a más tardar **2 días hábiles** después.
  - Si el servicio de Hacienda está caído: se almacena y se envía al restablecerse.
- **Validación de Hacienda:** máximo **3 horas**. Respuesta de aceptación o rechazo ([RES, art. 11](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)).
- **Entrega al cliente:** se entrega el comprobante aunque aún no haya respuesta de Hacienda; la respuesta se entrega después ([R, art. 18](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
- **Rechazo de Hacienda:** el comprobante "carecerá de validez". Se emite **de inmediato un nuevo comprobante** que indica cuál sustituye; **no** se hace nota de crédito ([R, art. 19 y 10](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf); [RES, art. 9](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)). Código de referencia 16, "Sustituye comprobante electrónico rechazado" ([AX, nota 9](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)).
- **Anulación o devolución:** un comprobante válido "no se puede anular directamente". Se usa **nota de crédito o débito** y el original queda inalterable ([R, art. 10](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)). La NC lleva `InformacionReferencia` con la **clave** del comprobante original ([DGT, lámina NC/ND](https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf)). Códigos útiles de la [nota 9](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf): 01 anula · 02 corrige monto · **06 devolución de mercancía** · 07 sustituye comprobante.
- **Confirmación por el receptor** (aceptación o rechazo): solo aplica entre obligados tributarios, "no es de aplicación para el consumidor final" ([RES, art. 10](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)). Si un comprador empresa rechaza la factura, el emisor debe hacer la NC y, si corresponde, un nuevo comprobante.
- **Conservación: 5 años** de todos los comprobantes "generados, enviados y recibidos, así como los documentos asociados", incluidos los anulados por NC. Se debe garantizar inalterabilidad e integridad ([R, art. 22 y 4.1.i](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)). El proveedor de sistemas solo está obligado a mantener **2 meses**; la conservación es responsabilidad del emisor ([R, art. 16](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf); [RES, art. 7](https://www.hacienda.go.cr/docs/Resolucion_General_sobre_disposiciones_tecnicas_comprobantes_electronicos_para.pdf)). Lo mismo aplica al facturador gratuito de Hacienda ([R, art. 22](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).
- **Sanciones:** la no emisión o no entrega se sanciona según los arts. 85–86 del Código Tributario; no enviar el XML, según el art. 83 ([R, art. 24](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)).

### 4.7 Puntos abiertos

- ⚠️ **Envío (flete) cobrado al cliente:** no verifiqué cómo debe facturarse. Opciones: una línea de servicio con su propio CABYS y tarifa IVA, o el nodo `OtrosCargos` (nota 16). La recomendación de modelo es tratarlo como un concepto con CABYS y tarifa propios, para no cerrar ninguna de las dos opciones.
- ⚠️ **Descuento a nivel de Pedido:** en el XML el descuento se expresa **por línea**, y `TotalDescuentos` es la suma ([AX, sección b y c](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf)). No verifiqué si existe un nodo de descuento global. Probablemente un descuento total deba prorratearse entre las líneas.
- ⚠️ **Precio con IVA incluido:** el XML trabaja con precio unitario **neto** + impuesto. Con un precio final entero en CRC, el neto y el IVA salen con decimales (p. ej. ₡10 000 con 13 % → neto 8 849,55752 + IVA 1 150,44248). No verifiqué qué redondeo usa cada proveedor para cuadrar con el total entero. Depende del proveedor, fuera de alcance.

---

## Implicaciones para el modelo de dominio

Principio: **el Pedido no genera el XML**. Lo hará un proveedor (fuera de alcance). El Pedido debe (a) guardar un *snapshot* suficiente para que el proveedor emita el comprobante sin volver a leer Producto ni Cliente, y (b) registrar los comprobantes que resulten, con su estado ante Hacienda.

### Pedido (`orders`)

- **`invoiceType`** / tipo de comprobante solicitado: `ticket` (TE, por defecto) · `invoice` (FE, si el cliente pide factura) · `none` (solo si la tienda está en RTS sin ser emisor no confirmante). Se decide en el checkout.
- **`billingSnapshot`**: datos del receptor copiados en el momento de la compra, no una referencia al Cliente (el Cliente puede cambiarlos después):
  - nombre;
  - `idType` (01–05);
  - `idNumber` (**string**, alfanumérico);
  - correo;
  - ubicación codificada (provincia, cantón, distrito como códigos del catálogo de Hacienda, barrio opcional, `otrasSenas`);
  - teléfono opcional;
  - `activityCode` opcional.
- **Correo de entrega del comprobante**, siempre, aunque sea tiquete sin receptor.
- **`saleCondition`** = `01` (contado) y **`currency`** = `CRC` fijos. El tipo de cambio será siempre 1.
- **Pagos**: lista de hasta 4 medios, cada uno con `method` mapeable a la nota 6 (tarjeta 02, transferencia 04, SINPE Móvil 06, plataforma digital 07, otros 99) y su monto. Encaja con el "hueco de pago" ya decidido.
- **Comprobantes**: **relación 1..N** (subcolección `orders/{id}/einvoices` o colección `einvoices` con `orderId`), **no** un campo único. Un Pedido puede acumular:
  - un TE o FE original;
  - su sustituto si Hacienda lo rechazó;
  - NC por anulación o devolución, total o parcial;
  - eventualmente ND.

  Cada documento de comprobante reserva:
  - `docType` (01/02/03/04);
  - `clave` (string de 50);
  - `consecutivo` (string de 20);
  - `issuedAt`;
  - `situation` (1/2/3);
  - `haciendaStatus`: `pending` → `sent` → `accepted` | `rejected` | `error`;
  - mensaje de respuesta;
  - `reference` { clave del comprobante referenciado, `referenceCode` de la nota 9, motivo };
  - totales tal como los devolvió el proveedor: venta neta, impuesto, total. Guardarlos como decimales o strings, **sin recalcularlos**;
  - rutas en Storage de `clave.xml`, `clave_respuesta.xml` y `clave.pdf`;
  - `providerId`/`externalId` genéricos.
- **Estado de facturación del Pedido**, independiente del estado logístico: `notRequired` · `pending` · `issued` · `accepted` · `rejected` (→ reemitido) · `creditedPartial` · `creditedFull`.
- **Reglas que el modelo debe respetar:**
  1. Un Pedido con comprobante emitido **no se borra ni se edita en montos**. La anulación o devolución crea una NC (código 01 anula, 06 devolución) y además revierte stock, que ya estaba en alcance.
  2. **El número de Pedido ≠ consecutivo de Hacienda.** El consecutivo es estrictamente secuencial y sin saltos por tipo, sucursal y terminal. Lo asigna el sistema emisor, no Firestore. Hay Pedidos que nunca se facturan (abandonados o cancelados antes del pago).
  3. Retención de **5 años** para comprobantes y XML: no aplicar TTL ni borrado a esos documentos ni a sus archivos.

### Línea de Pedido

Snapshot por línea:

- `productId`, `sku` (→ `CodigoComercial`);
- **`cabysCode`** (13 caracteres, obligatorio);
- `description` (→ `Detalle`);
- **`unitOfMeasure`** (catálogo de la nota 15, p. ej. unidad);
- `quantity`;
- `unitPrice` con IVA en CRC entero (decisión ya tomada);
- **`vatRateCode`** (nota 8.1) + `vatRate` (%);
- `discountAmount`, con espacio para `discountCode` (nota 20) y su descripción.

Los montos neto e impuesto por línea son **derivables**; si el proveedor los devuelve, conviene guardarlos en el snapshot del comprobante, no en la línea.

- Envío o flete: reservar que pueda representarse como una "línea" o cargo con su propio `cabysCode` y `vatRateCode` (⚠️ punto abierto en 4.7).

### Cliente (`customers`)

**Datos de facturación opcionales**, que solo se piden si el cliente quiere FE:

- nombre o razón social (3–100);
- `idType` (01 física, 02 jurídica, 03 DIMEX, 04 NITE; 05 extranjero no domiciliado solo sirve para TE);
- `idNumber` como **string** (las cédulas jurídicas pasan a admitir letras, ajuste del 22/04/2026);
- correo de facturación;
- ubicación con **códigos** de provincia/cantón/distrito del catálogo de Hacienda + otras señas (5–160 caracteres);
- teléfono opcional;
- `activityCode` opcional (6 caracteres).

La dirección de envío ya prevista (Provincia/Cantón/Distrito + señas) debe guardar también los **códigos** del catálogo, no solo los nombres, para poder reutilizarla como ubicación del receptor.

### Producto (`products`)

- **`cabysCode`** obligatorio para poder venderse, validable contra el catálogo CABYS del BCCR.
- **`vatRateCode`**: no asumir 13 % para todo el catálogo.
- **`unitOfMeasure`**.
- `sku`/código comercial.
- Descripción apta para comprobante.

Estos valores se **copian** a la línea de Pedido al comprar; si cambian en el Producto, no afectan comprobantes ya emitidos.

### Contraste con decisiones ya tomadas del mapa

- *Montos en CRC enteros:* **compatible**. El XML usa decimales de hasta 5 cifras, pero eso se resuelve al emitir. Los montos del comprobante se guardan como los devuelve el proveedor, sin forzarlos a enteros ni recalcularlos (ver ⚠️ precio con IVA incluido).
- *Precios mostrados con IVA:* **compatible**. El comprobante desglosa neto + IVA por tarifa ([R, art. 13.14–15](https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf)), lo que exige conocer la tarifa por Producto y por línea.
- *El Pedido deja huecos para pago, envío y factura electrónica:* **compatible, con una precisión**. El hueco de factura debe ser una **colección 1..N de comprobantes con estado**, no un campo único.
- *Datos del cliente en checkout aún no decididos:* hay un **mínimo** que sale de la norma: correo de entrega siempre, y la opción "quiero factura electrónica", que exige nombre + tipo y número de identificación. Ubicación y correo son condicionales en FE.
