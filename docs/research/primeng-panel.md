# Tienda CR: qué ofrece PrimeNG 20 para el Panel

Respuesta a [#74](https://github.com/Darkmixt12/ws-steven-munoz/issues/74), hija del mapa
[#73](https://github.com/Darkmixt12/ws-steven-munoz/issues/73). Es investigación: reúne hechos y opciones, no elige el
diseño.

## Versiones y fuentes

- Instalado: `primeng` **20.4.0**, `@primeng/themes` **20.4.0**, `@primeuix/themes` **1.2.5**,
  `@angular/core` 20.3.15, `@firebase/firestore` 4.8.0 (leído en `node_modules`).
- `primeng.org` ya documenta la v22 (`npm view primeng dist-tags`: `latest = 22.1.1`,
  `v20-stable = 20.4.0`). La documentación de la v20 está en **https://v20.primeng.org**. Su fuente es
  `apps/showcase/doc/**` del repositorio `primefaces/primeng` en la etiqueta `20.4.0`. De ahí salen las citas
  «doc: …».
- Citas «d.ts: …» = `node_modules/primeng/<componente>/index.d.ts`. Citas «fesm: …» =
  `node_modules/primeng/fesm2022/primeng-<componente>.mjs`.

## 1. Tabla (`p-table`)

### Modo lazy (servidor) frente a cliente

- **Cliente** (lo predeterminado): la tabla recibe todo el arreglo en `value`, y pagina, ordena y filtra en memoria.
  Usa `globalFilterFields`, `filterDelay` (300 ms por defecto), `filterLocale`, `customSort` con `sortFunction`, y
  `sortMode: 'single' | 'multiple'` (d.ts: table; fesm: `filterDelay = 300`, `sortMode = 'single'`).
- **Lazy**: con `[lazy]="true"` la tabla no procesa datos. Cada paginación, orden o filtro emite
  `(onLazyLoad)` con un `TableLazyLoadEvent`: `first`, `rows`, `sortField`, `sortOrder`, `multiSortMeta`,
  `filters`, `globalFilter` y `last` (d.ts: `api` `LazyLoadMeta` y `types/table`). La página actual se entrega en
  `value`. Hay que pasar `totalRecords` para que el paginador sepa cuántas páginas hay, y `loading` muestra la
  máscara. `lazyLoadOnInit` es `true` por defecto (fesm).
  - Según la doc (`table/lazyloaddoc.ts`), con lazy la **selección por checkbox queda a cargo de quien usa la tabla**.
    El ejemplo maneja a mano `selection`, `selectAll` y `(selectAllChange)`.
- **Límite con Firestore:** el evento habla en **desplazamientos** (`first` = índice de la primera fila). El SDK web
  de Firestore no tiene `offset()`: `@firebase/firestore` 4.8.0 exporta `limit`, `limitToLast`, `startAfter`,
  `endBefore` y `getCountFromServer`, pero ningún `offset`. Pasar de «página N» a un cursor
  (`startAfter(últimoDoc)`) lo tiene que resolver el código del Panel. Lo mismo vale para saltar a una página
  arbitraria y para calcular `totalRecords` (p. ej. con `getCountFromServer`). Cada combinación de filtro y orden
  que llegue a Firestore necesita un índice compuesto (ver `docs/tienda-indices-y-ttl.md`). El paginador sí permite
  quitar los saltos arbitrarios: `showPageLinks`, `showFirstLastIcon`, `showJumpToPageDropdown` y
  `showJumpToPageInput` son entradas de la tabla (fesm: inputs de `p-table`).
- **Scroll virtual:** `virtualScroll`, `virtualScrollItemSize` (obligatorio, alto de fila fijo),
  `virtualScrollOptions` y `virtualScrollDelay` (250 ms). Se combina con `lazy` para cargar por tramos. El ejemplo
  está en `table/virtualscrolllazydoc.ts`. Requiere `scrollable` y `scrollHeight` (`'flex'` o un alto fijo).

### Filtros por columna

- `<p-columnFilter>` con `type` (`text` por defecto, `numeric`, `boolean`, `date`) y `display` (`'row'` por
  defecto, o `'menu'`) (fesm: `type = 'text'`, `display = 'row'`). Otras entradas: `matchMode`,
  `matchModeOptions`, `showMenu`, `showOperator`, `showAddButton`, `maxConstraints`, `showApplyButton`,
  `showClearButton` y `hideOnClear`. También `currency`, `locale`, `minFractionDigits` y `maxFractionDigits`
  para los filtros numéricos. `filterOn` vale `'enter'` por defecto (d.ts y fesm).
- Modos de coincidencia (`FilterMatchMode`): `startsWith`, `contains`, `notContains`, `endsWith`, `equals`,
  `notEquals`, `in`, `lt`, `lte`, `gt`, `gte`, `between`, `is`, `isNot`, `before`, `after`, `dateIs`, `dateIsNot`,
  `dateBefore` y `dateAfter` (d.ts: api).
- Un filtro propio se escribe con la plantilla `filter` de `p-columnFilter`, que entrega `filterCallback`. La doc
  la usa con `p-multiselect` y `matchMode="in"` (`table/lazyloaddoc.ts`).
- En modo lazy los `filters` llegan tal cual en el evento, y traducirlos a una consulta es trabajo propio.

### Selección, columnas congeladas y otras funciones

- Selección: `selectionMode` (`single` | `multiple`), `dataKey`, `metaKeySelection`, `selectionPageOnly` y
  `compareSelectionBy`, más los componentes `p-tableCheckbox`, `p-tableHeaderCheckbox` y `p-tableRadioButton`
  (d.ts).
- Columnas congeladas: directiva `pFrozenColumn` con `[frozen]` y `alignFrozen` (`left` | `right`). Requiere
  `scrollable`, y la posición *sticky* se recalcula con un `ResizeObserver` (d.ts: `FrozenColumn`). Filas
  congeladas: `frozenValue`.
- Además: `stateStorage` (`session` por defecto) con `stateKey`, `resizableColumns`, `reorderableColumns`,
  `editMode` (`cell` | `row`), `rowGroupMode`, `expandedRowKeys`, `exportCSV` (`exportFilename`),
  `contextMenu`, `size` (`small` | `large`), `showGridlines` y `stripedRows` (d.ts).

### Responsive y modo apilado

- **`responsiveLayout` está deprecado desde la v20.** El d.ts dice: *«@deprecated since v20.0.0, always defaults to
  scroll, stack mode needs custom implementation»*. El valor por defecto es `'scroll'` y `breakpoint` vale
  `'960px'` (fesm).
- El código del modo `'stack'` sigue en 20.4.0 (`createResponsiveStyle()` inyecta un `<style>` que, bajo el
  `breakpoint`, oculta `thead`/`tfoot` y pasa cada `td` a `display:flex`). Pero está deprecado y la doc v20 ya no
  tiene su página: en `apps/showcase/doc/table/` no hay `responsivedoc`, aunque sí existe para `dialog`, `toast`,
  `carousel`, etc.
- En pantallas angostas quedan tres opciones:
  1. scroll horizontal (lo predeterminado), con `pFrozenColumn` para fijar la columna clave;
  2. apilado propio: CSS con media queries y `<span class="p-datatable-column-title">` en cada celda, que es lo que
     el modo deprecado mostraba;
  3. otro componente en móvil, como `p-dataview` (existe en `node_modules/primeng/dataview`), o tarjetas propias.

  Cualquiera de las tres se construye a mano.

### Import

- En 20.4.0, `Table` se declara con `isStandalone: false` en el fesm. La doc importa **`TableModule`**, que
  agrupa `Table`, `SortableColumn`, `FrozenColumn`, `ColumnFilter`, `TableCheckbox`, etc. (d.ts: `ɵmod`). Otros
  componentes, como `Button`, sí son standalone.

## 2. Layout

Lo que trae PrimeNG 20.4.0 (directorios en `node_modules/primeng`):

| Pieza | Componente | Notas |
| --- | --- | --- |
| Panel lateral superpuesto | `p-drawer` | `position` (`left`, `right`, `top`, `bottom`), `fullScreen`, `modal`, `dismissible`, `blockScroll`, `closeOnEscape`. `showCloseIcon` está deprecado: usar `closable` (d.ts). |
| Menú de navegación | `p-menu`, `p-panelmenu`, `p-tieredmenu`, `p-megamenu` | `p-panelmenu` (acordeón, `multiple`) sirve como menú lateral de dos niveles. `p-menu` admite `popup`. Todos usan `MenuItem` con `routerLink`. |
| Barra superior | `p-menubar`, `p-toolbar` | `p-menubar` pasa a botón hamburguesa bajo `breakpoint` (`'960px'` por defecto, fesm). Tiene plantillas `start` y `end`. |
| Migas | `p-breadcrumb` | `model`, `home`, `homeAriaLabel`. |
| Pestañas | `p-tabs` / `p-tablist` / `p-tab` / `p-tabpanels` / `p-tabpanel` | API con señales, `scrollable` y `lazy`. `TabView` ya no existe en la v20 (no hay directorio `tabview`). |
| Asistente por pasos | `p-stepper` / `p-step-list` / `p-step` / `p-step-panels` / `p-step-panel` | `value` como señal. Sigue existiendo `p-steps` (menú de pasos). |
| Contenedores | `p-card`, `p-panel`, `p-fieldset`, `p-divider`, `p-splitter`, `p-scrollpanel` | — |

**Lo que no trae y hay que construir a mano:** el *shell* del Panel, o sea la grilla de menú lateral fijo +
contenido + barra superior, cuándo el menú lateral pasa a `p-drawer` en móvil, el estado abierto o cerrado y el
enlace activo según la ruta. PrimeNG no incluye un componente de layout de aplicación: su plantilla «Sakai» es un
producto aparte y no está en el paquete. Tampoco trae utilidades de grilla CSS. La doc v20 remite a Tailwind
(sección `tailwind` y la guía `primeflex`), y PrimeFlex está en desuso.

## 3. Formularios

- **Base común (d.ts `baseinput` y `baseeditableholder`):** los campos exponen `invalid`, `required`, `name`,
  `fluid`, `variant` (`outlined` | `filled`) y `size` (`small` | `large`). `pInputText` usa `pSize`. Funcionan con
  `FormsModule` y `ReactiveFormsModule`. PrimeNG **no valida**: `invalid` solo pinta el estado, y el mensaje se
  arma con `p-message` (`severity`, `size`, `variant: 'simple'`) o con HTML propio. `providePrimeNG` acepta
  `inputVariant`, que reemplaza a `inputStyle`, deprecado en la v20 (d.ts: config).
- **`p-fileupload` (Imágenes):** `mode` (`advanced` | `basic`), `accept`, `maxFileSize`, `fileLimit`,
  `multiple`, `auto`, `url`, `withCredentials`, `showUploadButton` y `previewWidth`. Eventos: `onSelect` y
  `onRemove`. Para subir a Firebase Storage se usa `[customUpload]="true"` con `(uploadHandler)`, y el componente
  entrega los `File` sin hacer HTTP (doc: `fileupload/customdoc.ts`). El progreso, el reintento, el orden de las
  imágenes y la imagen principal quedan a cargo de quien lo usa.
- **`p-inputnumber` con colones:** `mode="currency"`, `currency`, `currencyDisplay` (`symbol` | `code`),
  `locale`, `minFractionDigits` y `maxFractionDigits` (doc: `inputnumber/currencydoc.ts`). Formatea con `Intl`. En
  Node 24, `Intl.NumberFormat('es-CR', {style:'currency', currency:'CRC'})` da `₡1 234 567,50` con **2
  decimales** por defecto. Con `maxFractionDigits: 0` da `₡1 234 567`. El separador de miles de `es-CR` es un
  espacio especial, así que conviene probar la edición en un prototipo.
- **Categorías de dos niveles:** `p-select` agrupa con `group`, `optionGroupLabel` y `optionGroupChildren`, y además
  tiene `filter`, `filterBy`, `virtualScroll` y `lazy`. `p-treeselect` admite `selectionMode` (`single`,
  `multiple`, `checkbox`), `filter`, `propagateSelectionUp/Down` y `virtualScroll` (d.ts). Para que solo se pueda
  elegir una subcategoría, `TreeNode` tiene `selectable?: boolean` (d.ts: api).
- **Etiquetas:** `p-autocomplete` con `multiple` (chips), `typeahead`, `dropdown`, `forceSelection`, `unique`,
  `addOnBlur`, `addOnTab`, `separator` (string o RegExp), `completeOnFocus`, `delay`, `group`, `virtualScroll` y
  `lazy` (d.ts). Las sugerencias se cargan en `(completeMethod)`. Con `forceSelection` apagado y
  `addOnBlur`/`separator`, se puede escribir una etiqueta nueva.
- **`p-confirmdialog`:** se usa con `ConfirmationService.confirm({...})`. Acepta `key` (varios diálogos),
  `defaultFocus` (`accept` | `reject` | `close` | `none`), `breakpoints`, `modal` y `appendTo` (d.ts).
- **`p-toast`:** se usa con `MessageService`. Acepta `key`, `position`, `life`, `preventDuplicates`,
  `preventOpenDuplicates` y `breakpoints` (fesm).
- **Estados:** `p-tag` (`severity`: `success`, `secondary`, `info`, `warn`, `danger`, `contrast`; `icon`,
  `rounded`) y `p-badge` / `p-overlaybadge` (`severity`; `badgeSize` o `size`: `small`, `large`, `xlarge`) (d.ts).
  Los colores de cada severidad se definen por tokens en el preset.
- **Idioma:** las cadenas por defecto están en inglés (fesm: config, `startsWith: 'Starts with'`,
  `dayNames: ['Sunday', …]`). Para el español hay que pasar `translation` a `providePrimeNG`; PrimeNG no trae
  locales incluidos. Esas cadenas también dan los `aria-label` de la tabla (ver §5).

## 4. Tema: `definePreset` sobre Aura

### Paquete

- **`@primeng/themes` está deprecado en npm:** *«This package is no longer maintained. Please migrate to
  @primeuix/themes»*. En 20.4.0 es un reexport: `@primeng/themes` → `@primeuix/styled`, y
  `@primeng/themes/aura` importa `@primeng/themes/aura/*`. La doc v20 importa todo desde **`@primeuix/themes`**
  (`definePreset`, `updatePreset`, `updatePrimaryPalette`, `updateSurfacePalette`, `usePreset`, `useTheme`) y
  **`@primeuix/themes/aura`**. `@primeuix/themes` ^1.2.5 ya está en `package.json`.
  `apps/tienda/src/app/app.config.ts` todavía importa `Aura` desde `@primeng/themes/aura`.

### Mecánica

```ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const Editorial = definePreset(Aura, {
  primitive: { /* paletas, borderRadius */ },
  semantic: { /* primary, formField, focusRing, colorScheme: { light, dark } */ },
  components: { /* button, datatable, … */ },
  extend: { /* tokens propios */ },
  css: ({ dt }) => `/* CSS global adicional */`,
});

providePrimeNG({ theme: { preset: Editorial, options: { darkModeSelector: 'none', cssLayer: false } } });
```

(doc: `theming/definepresetdoc.ts`, `extenddoc.ts`, `optionsdoc.ts`, `darkmodedoc.ts`)

- **Tres capas:**
  1. *Primitive*: paletas y `borderRadius`. Aura trae de `none` a `xl`.
  2. *Semantic*: `primary` (1–950, Aura lo apunta a `emerald`), `focusRing`, `formField`, `list`, `navigation`,
     `overlay`, `content`, `mask`, y bajo `colorScheme.light/dark`: `surface`, `primary.color`, `highlight`,
     `formField.*`, `text`, `content`.
  3. *Components*: tokens de cada componente.

  La doc recomienda armar un preset propio antes que sobrescribir componentes sueltos (`theming/componentdoc.ts`).
- **Nombres de variables:** cada token genera `--p-<ruta-en-kebab>`, y el prefijo se cambia con
  `options.prefix` (doc: `optionsdoc.ts`). Los tokens de raíz de un componente pierden el segmento `root`: la ruta
  `button.colorScheme.light.root.primary.background` sale como `--p-button-primary-background`, que es la variable
  que hoy se pisa a mano. `button.root.paddingX` sale como `--p-button-padding-x`.
- **Tokens propios:** `extend` (global o por componente) y `css: ({ dt }) => …` para agregar clases que lean esos
  tokens (doc: `extenddoc.ts`).
- **Tokens por instancia:** la entrada `[dt]` de cada componente. La doc la recomienda frente a `::ng-deep`
  (`theming/scopedtokensdoc.ts`).
- **En tiempo de ejecución:** `updatePreset`, `usePreset`, `updatePrimaryPalette` y `updateSurfacePalette`.

### Tipografía

- La doc v20 dice: *«There is no design for fonts as UI components inherit their font settings from the
  application.»* (`theming/fontdoc.ts`). Aura no tiene ningún token `fontFamily`: `aura/base` tiene 0 apariciones.
  Space Grotesk e Inter se aplican con CSS global, sobre `body` o sobre clases de títulos. Si hace falta una
  variable, se puede declarar con `extend` + `css`. Las fuentes ya se cargan desde Google Fonts en
  `apps/tienda/src/index.html` (Inter 400/500/600, Space Grotesk 500/700).
- Tokens de tipografía que sí existen: `fontSize` en `formField.sm/lg` y `fontWeight` en algunos componentes (p. ej.
  `button.label.fontWeight: 500`, las cabeceras de `datatable` con 600).

### Densidad

- **Escala global:** los componentes usan `rem`, así que cambiar el `font-size` de `html` los escala a todos
  (doc: `theming/scaledoc.ts`; la documentación misma usa 14px).
- **Densidad fina:** en Aura, `semantic.formField` tiene `paddingX: 0.75rem`, `paddingY: 0.5rem`,
  `sm {fontSize: 0.875rem, paddingX: 0.625rem, paddingY: 0.375rem}` y
  `lg {fontSize: 1.125rem, paddingX: 0.875rem, paddingY: 0.625rem}`. Botones, campos y selects heredan de ahí:
  `button.paddingX = {form.field.padding.x}`. También están `list.option.padding`, `navigation.item.padding` y
  `overlay.*.padding`. Las celdas de `datatable` usan `padding: 0.75rem 1rem`, con `sm` en `0.375rem 0.5rem` y
  `lg` en `1rem 1.25rem`, que es lo que activa `size` en la tabla (`@primeuix/themes/dist/aura/base` y
  `aura/datatable`).
- **Radio:** `formField.borderRadius = {border.radius.md}`. Llevar las esquinas a 0 en todo el Panel se hace desde
  `primitive.borderRadius` o desde los semánticos, sin tocar cada componente.

### Modo oscuro

- `options.darkModeSelector`: `'system'` por defecto (`@media (prefers-color-scheme: dark)`). Acepta una clase
  (`.my-app-dark`) para un interruptor manual, o `false`/`'none'` para apagarlo (doc: `darkmodedoc.ts`). Hoy
  `styles.scss` declara `color-scheme: light`, pero el preset no fija ningún selector, así que Aura genera las
  variables oscuras bajo `prefers-color-scheme`.

### Reemplazar los `--p-*` duplicados

- `admin-login.ts` y `admin-no-access.ts` repiten en `:host` los `--p-button-primary-*`, `--p-button-border-radius`
  y `--p-button-padding-x/y`. `admin-no-access.ts` agrega además los `--p-button-secondary-*`. Los colores de marca
  (`--hueso`, `--tinta`, `--acento`) y `font-family` también están duplicados.
- Opciones que da PrimeNG:
  - **(a)** Llevarlos a un preset `definePreset(Aura, …)`:
    - `components.button.colorScheme.light.root.primary/secondary.*`;
    - `components.button.root.borderRadius/paddingX/paddingY`, o sus equivalentes semánticos;
    - los colores de marca como `primitive` o como `extend`.
  - **(b)** Pasar el mismo objeto de tokens por `[dt]` solo en esos botones.
  - **(c)** Dejarlos en una hoja global en vez de en cada `:host`.

  La doc recomienda (a) para un estilo propio y (b) para excepciones locales.
- **Qué hacer con `::ng-deep`:** `admin-login.ts` todavía lo usa para `.p-button` (`border-width`,
  `letter-spacing`, ancho completo en móvil). `border-width` y `letter-spacing` no tienen token, así que van en
  `components.button.css` o en CSS global. El ancho completo se cubre con la entrada `fluid`.
- **CSS layer:** `cssLayer` está apagado por defecto. Si se activa, los estilos de PrimeNG quedan en la capa
  `primeng`, y el CSS de la app sin capa gana siempre (doc: `specificitydoc.ts`, `optionsdoc.ts`).

## 5. Accesibilidad y teclado

**Tabla** (doc: `table/accessibilitydoc.ts`):

- **Roles:** `table`, `rowgroup`, `row`, `columnheader` y `cell`. Las cabeceras ordenables llevan `aria-sort`.
  `aria-posinset`, `aria-setsize`, `aria-label` y `aria-describedby` de filas y celdas **los pone quien arma la
  plantilla**.
- **Checkbox y radio de selección:** toman su etiqueta de `aria.selectRow/unselectRow/selectAll/unselectAll` en
  `translation`. Una fila seleccionada lleva `aria-selected`.
- **Menú de filtro:** el botón lleva `aria-haspopup`, `aria-expanded` y `aria-controls`. El popup tiene
  `role="dialog"` con `aria-modal`. Los `aria-label` de los filtros propios corren por cuenta de quien los escribe.
  Las celdas editables manejan sus roles a mano.
- **Teclado en cabeceras:** `tab` recorre las cabeceras, y `enter` o `space` ordenan.
- **Teclado en el menú de filtro:** `tab`, `escape` y `enter`.
- **Teclado en la selección:** `↑` `↓` `home` `end`, `enter`/`space` alternan, y `shift+↑/↓`, `shift+space`,
  `ctrl+shift+home/end` y `ctrl+a` seleccionan en bloque.
- **Botones internos** (filtro, expandir, editar): se alcanzan con `tab` y se activan con `space` o `enter`.

**ConfirmDialog** (doc: `confirmdialog/accessibilitydoc.ts`):

- `role="alertdialog"`, `aria-labelledby` apuntando a la cabecera, y `aria-modal` porque el foco queda dentro.
- Si `confirm()` recibe el `target` que lo abrió, el componente pone `aria-expanded` y `aria-controls` en ese
  disparador. Si el diálogo se controla con `visible`, esos atributos van a mano.
- Teclado: `tab` y `shift+tab` dentro del diálogo. `escape` cierra y devuelve el foco al disparador, y
  `enter`/`space` en un botón hacen la acción y devuelven el foco.

## 6. Límites y trabajo a mano (resumen)

1. **Paginación lazy sobre Firestore:** traducir `first`/`rows`/`sortField`/`filters` a cursores, `limit` e
   índices, y conseguir `totalRecords`. Firestore web no tiene `offset`.
2. **Tabla apilada en móvil:** `responsiveLayout="stack"` está deprecado desde la v20, así que se construye a mano o
   se usa otro componente en pantallas angostas.
3. **Shell del Panel:** menú lateral, `p-drawer` en móvil, enlace activo y grilla. PrimeNG solo pone las piezas.
4. **Validación y mensajes de formulario:** PrimeNG solo pinta `invalid`, y los mensajes van con `p-message` o HTML
   propio.
5. **Subida de Imágenes:** `customUpload` + `uploadHandler` → Storage. Progreso, orden e imagen principal son
   propios.
6. **Selección en tabla lazy:** estado propio (`selection`, `selectAll`).
7. **Traducción al español:** `translation` completo, que también alimenta los `aria-label`.
8. **Tipografía:** la da el CSS de la app, porque no hay token de fuente.
9. **Paquete de temas:** `@primeng/themes` está deprecado a favor de `@primeuix/themes`.
