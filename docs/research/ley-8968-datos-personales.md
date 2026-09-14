# Ley 8968 y datos personales de Clientes y Empleados

> Investigación para el ticket #49 (mapa #35). Fecha de corte: 2026-09-14.
> Es información legal general para diseñar el modelo de datos, **no es asesoría legal**. Antes de salir a producción, conviene que una persona abogada revise el aviso de privacidad y la política de conservación.

## Pregunta

¿Qué implica la Ley 8968 (Protección de la Persona frente al Tratamiento de sus Datos Personales) para guardar datos de Clientes y Empleados en la tienda online (solo Costa Rica, Firebase Auth + Firestore)?

1. ¿Qué consentimiento hay que obtener y conservar, y con qué evidencia?
2. ¿La cédula, el teléfono y la dirección son datos de acceso restringido o sensibles?
3. ¿Una tienda pequeña debe inscribir su base de datos ante la PRODHAB?
4. ¿Qué pasa si un Cliente pide borrar su cuenta y tiene Pedidos que Hacienda obliga a conservar?

## Fuentes

Primarias:

- **[L]** Ley N.° 8968, texto completo en SCIJ (Procuraduría General de la República): <https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=70975&nValor3=85989&strTipM=TC>. El SCIJ carga el texto con JavaScript, así que se leyó la impresión del SCIJ **generada el 7/1/2026** que publica el MICITT: <https://micitt.go.cr/sites/default/files/marco_juridico_legal/08.%20Ley%20n.%C2%B0%208968%20Ley%20de%20Protecci%C3%B3n%20de%20la%20Persona%20frente%20al%20tratamiento%20de%20sus%20datos%20personales..pdf>. Esa impresión no trae ninguna nota de reforma, así que el texto de la ley sigue siendo el original de 2011.
- **[R]** Reglamento, Decreto Ejecutivo N.° 37554-JP, texto vigente en SCIJ: <https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=74352&nValor3=106487&strTipM=TC>. Se leyó la impresión del SCIJ **generada el 23/02/2022** que publica el IAFA: <https://www.iafa.go.cr/wp-content/uploads/2022/03/Reglamento-a-la-Ley-de-Proteccion-de-la-Persona-frente-al-Tratamiento-de-sus-Datos-Personales.pdf>. Ya incorpora las reformas de los decretos **40008-JP (19/07/2016)** y **41582-JP (21/02/2019)**.
- **[P]** PRODHAB, página de normativa (solo remite a la Ley y al Reglamento de arriba): <https://prodhab.go.cr/acercade/normativa/>. Volante oficial "¿Mi base de datos es legal?": <https://prodhab.go.cr/capacitacion/multimedia/guias%20y%20volantes/20170925-%20Volante%20registro%20base%20de%20datos%20tiro-01.jpg>.
- **[H]** Decreto Ejecutivo N.° 44739-H, Reglamento de Comprobantes Electrónicos para efectos tributarios (2 de octubre de 2024), art. 22. Cita y parafrasea el art. 109 del Código de Normas y Procedimientos Tributarios: <https://www.hacienda.go.cr/docs/REGLAMENTO_DE_COMPROBANTES_ELECTRONICOS.pdf>.
- **[AL]** Expediente legislativo 23.097, "Ley de Protección de Datos Personales". Texto base: <https://proyectos.conare.ac.cr/asamblea/23097%20TEXTO%20BASE.pdf>. Historial del trámite: <https://delfino.cr/asamblea/proyecto/23097>.

Secundarias (se usan solo donde no se pudo leer la fuente primaria, y cada uso va marcado):

- **[S1]** Resumen de la Ley N.° 10946 con extractos (Bufete de Costa Rica): <https://bufetedecostarica.com/gobernanza-de-los-servicios-digitales-y-el-comercio-electronico-en-costa-rica-10946/>. **[S2]** KPMG Costa Rica, newsflash del 30/06/2026: <https://kpmg.com/cr/es/insights/2026/06/newsflash-jun-30.html>.
- **[S3]** El Financiero, "Requerimientos de información, plazo para custodia de documentos y prescripción tributaria" (05/06/2022), sobre los arts. 51 y 109 del CNPT: <https://www.elfinancierocr.com/blogs/tributario-cr/requerimientos-de-informacion-plazo-para-custodia/MADKELBWCBHHZJPR32VWCMAHSU/story/>.

## Estado normativo al 2026-09-14

- **La Ley 8968 no ha sido reformada.** La impresión SCIJ de enero de 2026 no tiene notas de reforma [L]. El Reglamento se reformó con los decretos 40008-JP (2016) y 41582-JP (2019) [R]. No se encontró ninguna reforma posterior del Reglamento. ⚠️ No se pudo leer una impresión del Reglamento posterior a feb-2022; hay que confirmarlo en SCIJ antes de producción.
- **El proyecto de ley 23.097**, que busca derogar la Ley 8968 con un modelo tipo RGPD, **no es ley**. Se aprobó en primer debate el 14/10/2024, pero el 17/10/2024 se aprobó una moción de retrotracción, y no aparecen trámites en 2025 ni en 2026 [AL]. ⚠️ No se pudo confirmar en el SIL de la Asamblea si se archivó o si se prorrogó su plazo cuatrienal, que vencía en mayo de 2026. Si se aprobara, el modelo tendría que revisarse: por ejemplo, podría traer una base de legitimación contractual distinta del consentimiento, portabilidad o un delegado de protección de datos.
- **Novedad relevante: Ley N.° 10946, "Gobernanza de los Servicios Digitales y el Comercio Electrónico"**, publicada en el Alcance 80 a La Gaceta 116 del **24/06/2026**. **Entra a regir 12 meses después**, o sea, alrededor de junio de 2027 [S1][S2]. Según [S1], su **art. 28** obliga a comerciantes y prestadores a "adoptar medidas de seguridad eficaces … para proteger la integridad, veracidad y confidencialidad de los datos personales" y a informar al consumidor de esas medidas. Lo hace "sin detrimento de … la ley 8968 … o cualquiera que la sustituya", así que **no la reforma ni la deroga**. Su **art. 29** restringe las comunicaciones comerciales no solicitadas sin consentimiento previo. También exige informar la identidad del comerciante, los precios y las condiciones [S2]. ⚠️ No se pudo leer el texto oficial de La Gaceta; esto sale de resúmenes de terceros.

## Respuestas

### 1. Consentimiento: qué obtener y cómo probarlo

- **Deber de informar antes de recolectar** (Ley art. 5.1) [L]. Hay que informar "de modo expreso, preciso e inequívoco":
  - (a) que existe la base de datos;
  - (b) los fines;
  - (c) los destinatarios y quién podrá consultarla;
  - (d) qué respuestas son obligatorias y cuáles facultativas;
  - (e) el tratamiento que se dará a los datos;
  - (f) las consecuencias de negarse a darlos;
  - (g) los derechos que puede ejercer la persona;
  - (h) la identidad y dirección del responsable.

  En formularios, estas advertencias deben verse "en forma claramente legible".
- **Consentimiento expreso y por escrito**, "en un documento físico o electrónico", revocable de la misma forma y sin efecto retroactivo (Ley art. 5.2) [L]. Si se recaba en línea, el responsable debe poner a disposición un procedimiento para otorgarlo (Regl. art. 5) [R].
- **Requisitos del consentimiento** (Regl. art. 4) [R]: libre, **específico** (una o varias finalidades determinadas), informado, **inequívoco** ("de forma tal que pueda demostrarse de manera indubitable su otorgamiento y que permita su consulta posterior") e individualizado (al menos uno por titular).
- **Si el consentimiento va dentro de un contrato** (por ejemplo, los Términos y Condiciones), el contrato "deberá contar con una cláusula específica e independiente sobre consentimiento del tratamiento de datos personales" (Regl. art. 2.f) [R]. En la práctica: una casilla propia, no escondida en los T&C.
- **La carga de la prueba es del responsable "en todos los casos"** (Regl. art. 6) [R]. Por eso hay que guardar evidencia fechada y versionada.
- **Revocación**: debe haber mecanismos "expeditos, sencillos y gratuitos" (Regl. art. 7). El responsable tiene **5 días hábiles** para aplicarla y avisar a quienes se hayan transferido los datos (art. 8), y **3 días hábiles** para confirmar el cese si el titular lo pide (art. 9) [R].
- **Excepciones al consentimiento** (Ley art. 5.2): orden judicial, datos de acceso irrestricto tomados de fuentes públicas, o datos que deban entregarse por disposición legal [L]. Ninguna cubre los datos que el Cliente teclea en la tienda, así que **hace falta consentimiento**.
- **Marketing**: el uso para una finalidad distinta de la autorizada es falta grave (Ley art. 30.c) [L]. Además, la Ley 10946 art. 29 pide consentimiento previo para comunicaciones comerciales no solicitadas [S1]. Por eso el consentimiento de marketing debe ir **separado** del consentimiento para gestionar la cuenta y los Pedidos.

### 2. Clasificación de cédula, teléfono y dirección

La Ley distingue tres categorías (art. 3 c–e y art. 9) [L]:

- **Sensibles**: fuero íntimo (origen racial, opiniones políticas, religión, **condición socioeconómica**, datos biomédicos o genéticos, vida y orientación sexual, entre otros). Su tratamiento está prohibido salvo excepciones, y que una persona privada los recolecte o almacene es **falta gravísima** (art. 31.a).
- **De acceso restringido**: los que, "aun formando parte de registros de acceso al público, no son de acceso irrestricto por ser de interés solo para su titular o para la Administración Pública". Solo se pueden tratar para fines públicos o **con consentimiento expreso** (art. 9.2).
- **De acceso irrestricto**: los que están en bases públicas de acceso general según leyes especiales. La ley aclara que **no** entran aquí "la dirección exacta de la residencia … la fotografía, los números de teléfono privados y otros de igual naturaleza" (art. 9.3).

Aplicado al modelo:

| Dato | Clasificación | Base |
|---|---|---|
| Nombre, correo | Dato personal común. Requiere consentimiento porque se obtiene del titular, no de una fuente pública | Ley arts. 3.b, 5.2 [L] |
| Teléfono privado | **No es irrestricto** (lo excluye expresamente). En la práctica se trata como restringido y requiere consentimiento expreso | Ley art. 9.3 [L] |
| Dirección exacta (Provincia/Cantón/Distrito + señas) | **No es irrestricto** (lo excluye expresamente). Mismo trato que el teléfono | Ley art. 9.3 [L] |
| Cédula | ⚠️ **Incierto.** El número está en el Registro Civil, que es un registro público, pero la ley no lo clasifica expresamente. Lo prudente es tratarla como **restringida** y pedirla solo si hace falta (por ejemplo, para la factura electrónica a nombre del Cliente) | Ley arts. 3.d, 9.2 [L] |
| Datos de pago (tarjeta) | No los debe guardar la tienda: se delegan a la pasarela. Si se guardaran, exigirían medidas de seguridad reforzadas. Guardar la condición económica podría rozar la categoría "socioeconómica" sensible | Ley arts. 3.e, 10 [L] |
| Empleado: nombre, correo, rol, estado de acceso | Dato personal común, de uso interno | Ley art. 2, Regl. art. 2.c [L][R] |

Ninguno de estos datos es **sensible**. El modelo **no debe incluir** campos sensibles: nada de fechas de nacimiento con fines de perfilado de salud, género, biometría, etc. Sobre biometría, la PRODHAB consolidó en su Resolución 029-2026-RF que los datos biométricos son sensibles (dato secundario vía IAPP: <https://iapp.org/news/a/datos-biom-tricos-y-autodeterminaci-n-informativa-en-la-resoluci-n-n-029-2026-rf-de-la-prodhab>). Por eso no conviene usar verificación biométrica de identidad.

### 3. Inscripción ante la PRODHAB

- **Solo deben inscribirse las bases "administradas con fines de distribución, difusión o comercialización"** (Ley art. 21) [L]. Operar sin inscripción cuando la base cae en ese supuesto es falta gravísima (art. 31.e). Inscribirse implica un canon anual de US$200 (art. 33).
- El Reglamento define "distribución, difusión" como repartir o publicar datos a un tercero "siempre que medie un fin de comercializar el dato o medie el lucro con la base de datos". Define "comercializar" como vender, transar o enajenar los datos con fines de lucro a favor de un tercero (Regl. art. 2.e y 2.j) [R].
- **Base de datos interna** (Regl. art. 2.c, reformado en 2016): cualquier conjunto de datos personales "mantenidos por personas jurídicas … siempre y cuando las bases de datos o su contenido no sea comercializado, distribuido o difundido". El art. 44, en su párrafo final, dice: "**No serán sujetas de inscripción ante la Agencia, las bases de datos personales, internas o domésticas**" [R].
- El volante oficial de la PRODHAB lo resume así: "Si su base de datos comercializa, distribuye o difunde datos personales con intención comercial, entonces debe inscribirla ante la PRODHAB" [P].
- **Conclusión:** una tienda que usa los datos de Clientes y Empleados **solo para su propia operación**, sin venderlos, cederlos ni compartirlos con terceros con fines comerciales, **no está obligada a inscribir** su base. Esto cambia si algún día se venden o comparten datos para marketing de terceros.
- ⚠️ **Incierto / riesgo interpretativo:** la Ley art. 2 y el Regl. art. 3 dicen que el régimen **completo** "no será de aplicación" a las bases internas. Leído literalmente, casi toda la ley dejaría de aplicarse a la tienda. Pero el volante de la PRODHAB afirma que "todas las bases de datos personales que existen en Costa Rica están sujetas al control y fiscalización" de la Agencia [P]. Además, la Ley 10946 art. 28 añade deberes de seguridad para comercios en línea de todos modos [S1]. **Recomendación de diseño:** cumplir consentimiento, derechos y seguridad como si la ley aplicara por completo. Lo único que se deja fuera es la inscripción.

### 4. Derechos ARCO y borrado de cuenta con Pedidos

- **Derechos**: acceso, rectificación, supresión y consentir la cesión. Se atienden **gratis y en 5 días hábiles** (Ley art. 7; Regl. art. 18) [L][R]. El acceso debe cubrir "la totalidad del registro perteneciente al titular", en formato legible y con los códigos explicados (Regl. art. 20) [R]. Se pueden hacer consultas cada 6 meses como mínimo, salvo motivo fundado (Regl. art. 21) [R]. El responsable debe ofrecer medios electrónicos simplificados para ejercer los derechos (Regl. art. 16) [R]. Negarse sin justificación a eliminar o rectificar es falta grave (Ley art. 30.e) [L].
- **Excepción que resuelve el conflicto con Hacienda:** la supresión procede "salvo" cuando "los datos deban ser mantenidos por disposición constitucional, legal o resolución de órgano judicial" (Regl. art. 26.b) [R]. El encargado también debe suprimir los datos al terminar la relación "siempre y cuando no exista una previsión legal que exija la conservación" (Regl. art. 31.f) [R].
- **Plazo tributario:** el art. 109 del CNPT obliga a conservar los comprobantes, facturas y documentos de soporte **por cinco años**. Para comprobantes electrónicos, el Decreto 44739-H art. 22 exige almacenar los XML y sus documentos asociados "por un plazo de cinco años conforme a lo establecido en el artículo 109 … sin perjuicio de lo establecido en el párrafo segundo del artículo 51", garantizando su "inalterabilidad, privacidad … integridad y consulta posterior" [H].
  - ⚠️ El art. 51 CNPT (prescripción) fija 4 años como regla general. La Administración puede pedir documentos más viejos si siguen siendo relevantes para periodos no prescritos [S3]. No se leyó el texto primario del art. 51, que tiene supuestos de plazo más largo.
- **Límite superior (derecho al olvido):** los datos que puedan afectar al titular no se conservan más de **10 años** "salvo disposición normativa especial". Si hace falta conservarlos más tiempo, "deberán ser desasociados de su titular" (Ley art. 6.1) [L]. El Reglamento cuenta ese plazo "desde la fecha de terminación del objeto de tratamiento del dato" (Regl. art. 11) [R]. El Reglamento define la **desasociación** como disociar los datos "de modo que la información que se obtenga no pueda asociarse o vincularse a persona determinada o determinable" (Regl. art. 2.r) [R]. Los usos estadísticos posteriores no se consideran incompatibles si hay garantías (Ley art. 6.4) [L].
- **Resultado práctico:** cuando un Cliente pide borrar su cuenta, se **suprime** todo lo que no exige la ley: perfil, direcciones guardadas, teléfono, preferencias, carrito, consentimiento de marketing y usuario de Firebase Auth. Se **conservan bloqueados** solo los datos de facturación de los Pedidos o comprobantes (lo que figura en la factura electrónica) durante el plazo tributario. Al vencer, se **anonimizan** (desasocian) o se eliminan. Los Pedidos anonimizados pueden seguir alimentando los reportes de más y menos vendidos. Hay que responder por escrito al Cliente, explicando qué se borró y qué se conserva y por qué: una negativa debe justificarse por escrito (Regl. art. 22) [R].

### Otros deberes que tocan el diseño

- **Seguridad** (Ley art. 10; Regl. arts. 34–37) [L][R]: medidas técnicas y organizativas, un inventario de la infraestructura con "el nombre y la versión de la base de datos utilizada" (art. 36.c), análisis de riesgos y un plan de medidas. Recolectar o almacenar por "mecanismos inseguros" es falta leve (Ley art. 29.b) [L].
- **Brechas**: hay que informar a los titulares **en 5 días hábiles** desde la vulneración, e informar a titulares y a la Agencia de la naturaleza del incidente, los datos comprometidos, las acciones tomadas y dónde obtener más información (Regl. arts. 38–39) [R].
- **Historial**: el protocolo mínimo debe incluir "medidas y procedimientos técnicos que permitan mantener un historial de los datos personales durante su tratamiento" (Regl. art. 32.e) [R]. Esto encaja con los `auditEvents` de `moofyvip`. Ojo: esa bitácora también contiene datos personales y debe entrar en el borrado y la anonimización.
- **Protocolo mínimo de actuación** (Regl. art. 32) [R]: políticas y manual de privacidad, capacitación del personal, control interno y un procedimiento gratuito para quejas y derechos. ⚠️ El Reglamento dice que "deberán ser inscritas ante la Agencia", pero para bases no inscribibles eso no se aplica en la práctica. Queda como documento interno.
- **Proveedores en la nube (Firebase / Google Cloud):** el Reglamento contempla expresamente bases "en el sitio o en la nube" (art. 2.b) [R]. Pasar datos a un "encargado, proveedor de servicios o intermediario tecnológico" **no es transferencia** (Regl. arts. 2.w y 40) [R], así que no requiere consentimiento de transferencia. Pero **quien contrata el servicio mantiene la responsabilidad** y debe verificar que el proveedor cumpla medidas mínimas de seguridad (Regl. art. 29) [R].
  - ⚠️ La Ley art. 31.f califica como gravísimo "transferir, a las bases de datos de terceros países, información … sin el consentimiento de sus titulares" [L]. El Reglamento excluye al proveedor tecnológico del concepto de transferencia, pero un reglamento no puede contradecir la ley. Por prudencia, el aviso de privacidad debe decir que los datos se alojan con un proveedor de nube que puede estar fuera de Costa Rica, y el consentimiento lo cubre.
- **Transferencias reales** (a un tercero que usa los datos para sus propios fines): requieren consentimiento inequívoco, un contrato y que la carga de la prueba la asuma el responsable (Regl. arts. 40–43) [R]. Courier y pasarela de pago, si actúan por cuenta de la tienda, son encargados (Regl. arts. 2.k, 30–31) [R]. Aun así, deben aparecer como destinatarios en el aviso (Ley art. 5.1.c) [L].
- **Sanciones** (Ley art. 28) [L]: multas de hasta 5 salarios base (falta leve), de 5 a 20 (grave) y de 15 a 30 más suspensión del fichero (gravísima).

## Implicaciones para el modelo de dominio

1. **Registro de consentimiento (`consents`, append-only):** un documento por cada otorgamiento o revocación, nunca editado, porque la carga de la prueba es de la tienda (Regl. art. 6). Campos sugeridos:
   - `subjectType` (`customer` | `employee`) y `subjectId` (uid);
   - `purpose` (`account_and_orders` | `marketing` | …), uno por finalidad (Regl. art. 4.b);
   - `granted` (bool) y `grantedAt` / `revokedAt`;
   - `noticeVersion` más `noticeHash` (el hash del texto exacto del aviso de privacidad mostrado);
   - `channel` (`web_signup`, `checkout`, `account_settings`) y, opcionalmente, `userAgent` e IP truncada como evidencia;
   - `source` (quién lo registró: el titular o un Empleado en su nombre).

   Los textos de los avisos, versionados, deben conservarse para poder mostrar qué aceptó cada persona. El perfil del Cliente puede desnormalizar solo el estado actual (`marketingOptIn`, `privacyNoticeVersion`).
2. **Clasificación por campo:** marcar en el documento "Modelo de datos Firestore" cada campo personal como `común`, `restringido` (teléfono, dirección exacta y, por prudencia, cédula) o `sensible` (**ninguno permitido**). La cédula debe ser **opcional** y pedirse solo cuando haga falta para la factura electrónica. Nunca se guardan datos de tarjeta.
3. **Separar perfil de Pedido:** el Pedido guarda un **snapshot** de los datos que exige el comprobante: nombre, identificación si se facturó a nombre del Cliente, dirección de entrega y correo. No debe depender del perfil del Cliente. Así, borrar la cuenta no rompe el Pedido, y el Pedido puede tener su propio ciclo de retención.
4. **Borrado de cuenta = supresión + bloqueo + anonimización diferida:**
   - Al pedirlo, se borran el perfil, las direcciones guardadas, el carrito, el consentimiento de marketing (queda el registro de revocación) y el usuario de Auth.
   - En los Pedidos se pone `customerId` a `null` o a un seudónimo, más `retentionUntil` (fecha del comprobante + 5 años, ⚠️ que conviene validar con contador por el art. 51 CNPT) y `legalHold: 'tax'`.
   - Una tarea programada (Function) anonimiza el snapshot personal al vencer `retentionUntil` y deja las líneas, montos y fechas para los reportes.
   - Techo absoluto: 10 años o desasociación (Ley art. 6.1).
   - Hay que modelar una entidad o estado de **solicitud de derechos** (`dataRequests`: tipo acceso / rectificación / supresión / revocación, `receivedAt`, `dueAt` = +5 días hábiles, `resolvedAt`, respuesta) para cumplir los plazos y justificar las negativas por escrito.
5. **Bitácora de auditoría:** los `auditEvents` (before/after) copian datos personales. Deben entrar en la anonimización y en la respuesta de acceso, o guardar solo los ids y campos cambiados sin valores personales.
6. **Empleados:** base interna con datos mínimos (nombre, correo, rol, estado, `createdAt`/`disabledAt`). También necesitan aviso y consentimiento (mismo `consents` con `subjectType: 'employee'`). Al desactivar a un Empleado, sus datos deben suprimirse cuando dejen de ser necesarios, pero su id puede seguir en la auditoría como actor.
7. **Inscripción ante PRODHAB: no aplica** mientras la tienda no venda ni comparta datos con terceros para fines comerciales (Ley art. 21; Regl. arts. 2.c y 44). Si en el futuro se integra una herramienta de marketing de terceros que use los datos para fines propios, habría que revisarlo. Aun sin inscripción, conviene redactar el protocolo mínimo (Regl. art. 32) como documento interno.
8. **Firestore sigue siendo viable:** usar Firebase/Google Cloud como intermediario tecnológico no es transferencia (Regl. arts. 2.w y 40). La tienda sigue siendo responsable (Regl. art. 29): hay que elegir la región, documentarla en el inventario (Regl. art. 36.c) y mencionar el alojamiento en la nube, posiblemente fuera de CR, en el aviso de privacidad (⚠️ por la Ley art. 31.f).
9. **Horizonte regulatorio:** la Ley 10946 (vigente alrededor de junio de 2027) refuerza la seguridad y el consentimiento para comunicaciones comerciales. El proyecto 23.097, si revive, podría cambiar las bases de legitimación. El modelo de consentimiento por finalidad y versión cubre ambos escenarios.
