#!/usr/bin/env node
/**
 * Envoltorio de `test-rules` (issue #70).
 *
 * `firebase emulators:exec` lanza el emulador de Firestore como un proceso
 * `java` aparte y al cerrar solo le manda SIGINT, que en Windows no lo mata:
 * el jar sobrevive, deja tomados los puertos y la corrida siguiente falla con
 * «port taken». Este envoltorio barre esos jars antes y después de las
 * pruebas, y nunca toca un proceso ajeno a los emuladores de la tienda.
 */
import { spawn, execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const requerir = createRequire(import.meta.url);

/** Raíz del monorepo: los argumentos del comando son relativos a ella. */
const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../..'
);

const PROYECTO = 'demo-tienda-cr';
/** Firestore (8080) y su websocket (9150), Auth (9099) y Storage (9199). */
const PUERTOS = [8080, 9150, 9099, 9199];
const ESPERA_PREVIA_MS = 3000;
const ESPERA_LIMPIEZA_MS = 5000;
const ES_WINDOWS = process.platform === 'win32';
const PREFIJO = '[test-rules]';

function informar(mensaje) {
  console.log(`${PREFIJO} ${mensaje}`);
}

function advertir(mensaje) {
  console.warn(`${PREFIJO} ${mensaje}`);
}

/**
 * Solo los emuladores de la tienda. El jar de Firestore lleva su proyecto o su
 * puerto en la línea de comando; el de reglas de Storage no lleva ninguno de
 * los dos, así que se reconoce por el nombre del jar.
 */
function esEmuladorDeLaTienda(lineaDeComando) {
  const linea = lineaDeComando.toLowerCase();
  if (linea.includes('cloud-storage-rules-runtime')) {
    return true;
  }
  return (
    linea.includes('cloud-firestore-emulator') &&
    (linea.includes(PROYECTO) || linea.includes('--port 8080'))
  );
}

/**
 * Procesos java con su línea de comando, o `null` si no se pudo consultar
 * (sin `wmic` en Windows 11 se usa CIM; en el resto, `ps`).
 */
function listarProcesos() {
  try {
    if (ES_WINDOWS) {
      const consulta =
        'Get-CimInstance Win32_Process -Filter "Name=\'java.exe\'" |' +
        ' Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress';
      const salida = execFileSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', consulta],
        { encoding: 'utf8', windowsHide: true }
      ).trim();
      if (!salida) {
        return [];
      }
      const datos = JSON.parse(salida);
      const filas = Array.isArray(datos) ? datos : [datos];
      return filas
        .filter((fila) => fila && fila.CommandLine)
        .map((fila) => ({
          pid: Number(fila.ProcessId),
          comando: String(fila.CommandLine),
        }))
        .filter((proceso) => Number.isInteger(proceso.pid));
    }

    const salida = execFileSync('ps', ['-eo', 'pid=,args='], {
      encoding: 'utf8',
    });
    return salida
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean)
      .map((linea) => {
        const corte = linea.indexOf(' ');
        return {
          pid: Number(linea.slice(0, corte)),
          comando: linea.slice(corte + 1),
        };
      })
      .filter((proceso) => Number.isInteger(proceso.pid));
  } catch (error) {
    advertir(
      `no se pudo listar procesos (${error.message}); se omite el barrido`
    );
    return null;
  }
}

function cerrarProceso(proceso) {
  try {
    if (ES_WINDOWS) {
      execFileSync('taskkill', ['/PID', String(proceso.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      process.kill(proceso.pid, 'SIGKILL');
    }
    return true;
  } catch (error) {
    advertir(`no se pudo cerrar el PID ${proceso.pid} (${error.message})`);
    return false;
  }
}

/** Cierra los emuladores huérfanos de la tienda. Nunca es fatal. */
function barrer(momento) {
  const procesos = listarProcesos();
  if (procesos === null) {
    return 0;
  }
  let cerrados = 0;
  for (const proceso of procesos.filter((p) =>
    esEmuladorDeLaTienda(p.comando)
  )) {
    informar(
      `${momento}: cierro el emulador huérfano de la tienda (PID ${proceso.pid}).`
    );
    if (cerrarProceso(proceso)) {
      cerrados += 1;
    }
  }
  return cerrados;
}

function puertoOcupado(puerto) {
  return new Promise((resolver) => {
    const socket = net.connect({ host: '127.0.0.1', port: puerto });
    const terminar = (ocupado) => {
      socket.destroy();
      resolver(ocupado);
    };
    socket.setTimeout(500);
    socket.once('connect', () => terminar(true));
    socket.once('timeout', () => terminar(false));
    socket.once('error', () => terminar(false));
  });
}

async function puertosOcupados() {
  const ocupados = [];
  for (const puerto of PUERTOS) {
    if (await puertoOcupado(puerto)) {
      ocupados.push(puerto);
    }
  }
  return ocupados;
}

async function esperarPuertosLibres(msMaximo) {
  const limite = Date.now() + msMaximo;
  let ocupados = await puertosOcupados();
  while (ocupados.length > 0 && Date.now() < limite) {
    await new Promise((resolver) => setTimeout(resolver, 250));
    ocupados = await puertosOcupados();
  }
  return ocupados;
}

/** Corre `emulators:exec` con los mismos argumentos de siempre. */
function correrPruebas() {
  const firebase = requerir.resolve('firebase-tools/lib/bin/firebase.js');
  const argumentos = [
    firebase,
    'emulators:exec',
    '--config',
    'firebase.tienda.json',
    '--project',
    PROYECTO,
    '--only',
    'firestore,storage,auth',
    'npx jest --config libs/tienda/backend/rules/jest.config.ts',
  ];

  return new Promise((resolver) => {
    const hijo = spawn(process.execPath, argumentos, {
      cwd: RAIZ,
      stdio: 'inherit',
      shell: false,
    });

    const reenviar = (senal) => {
      try {
        hijo.kill(senal);
      } catch (error) {
        advertir(`no se pudo reenviar ${senal} al emulador (${error.message})`);
      }
    };
    process.on('SIGINT', () => reenviar('SIGINT'));
    process.on('SIGTERM', () => reenviar('SIGTERM'));

    hijo.once('error', (error) => {
      advertir(`no se pudo lanzar firebase (${error.message})`);
      resolver(1);
    });
    hijo.once('exit', (codigo, senal) => {
      resolver(senal ? 1 : codigo ?? 1);
    });
  });
}

function avisarPuertosAjenos(puertos) {
  advertir(
    `no se pueden iniciar los emuladores: los puertos ${puertos.join(', ')} ` +
      'están ocupados por procesos que no son emuladores de la tienda, así ' +
      'que no los toco. Esto NO es un fallo de las pruebas.'
  );
  const comando = ES_WINDOWS
    ? `netstat -ano | findstr :${puertos[0]}`
    : `lsof -i :${puertos[0]}`;
  advertir(`para ver quién los ocupa: ${comando}`);
}

async function principal() {
  try {
    barrer('pre-chequeo');
  } catch (error) {
    advertir(`falló el barrido previo (${error.message}); sigo igual`);
  }

  const ocupados = await esperarPuertosLibres(ESPERA_PREVIA_MS);
  if (ocupados.length > 0) {
    avisarPuertosAjenos(ocupados);
    return 1;
  }

  const codigo = await correrPruebas();

  // La limpieza nunca cambia el código de salida: manda el resultado de las
  // pruebas (criterio (c) del issue #70).
  try {
    barrer('limpieza');
    const siguenOcupados = await esperarPuertosLibres(ESPERA_LIMPIEZA_MS);
    if (siguenOcupados.length > 0) {
      advertir(
        `los puertos ${siguenOcupados.join(', ')} siguen ocupados tras la ` +
          `limpieza; ciérralos a mano antes de la próxima corrida. El código ` +
          `de salida (${codigo}) refleja solo el resultado de las pruebas.`
      );
    }
  } catch (error) {
    advertir(`falló la limpieza (${error.message}); no afecta a las pruebas`);
  }

  return codigo;
}

principal().then(
  (codigo) => process.exit(codigo),
  (error) => {
    advertir(`error inesperado del envoltorio (${error.message})`);
    process.exit(1);
  }
);
