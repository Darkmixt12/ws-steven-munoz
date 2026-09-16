/**
 * Corre una suite contra los emuladores de la tienda (issue #70, generalizado en #72).
 *
 * `firebase emulators:exec` lanza cada emulador como un proceso `java` aparte y
 * al cerrar solo le manda SIGINT, que en Windows no lo mata: el jar sobrevive,
 * deja tomados los puertos y la corrida siguiente falla con «port taken». Este
 * módulo barre esos jars antes y después, y nunca toca un proceso ajeno.
 *
 * Lo usan `tienda-rules:test-rules` y `tienda-functions:test-functions`, que
 * solo aportan qué emuladores levantar, qué puertos vigilar y qué comando correr.
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
  '../../../..'
);

/** Proyecto solo de emuladores: con el prefijo `demo-`, nunca toca un proyecto real. */
export const PROYECTO = 'demo-tienda-cr';

const ESPERA_PREVIA_MS = 3000;
const ESPERA_LIMPIEZA_MS = 5000;
const ES_WINDOWS = process.platform === 'win32';

/**
 * El jar de Firestore lleva su proyecto o su puerto en la línea de comando, así
 * que se reconoce por cualquiera de los dos.
 */
export function esEmuladorDeFirestore(linea) {
  return (
    linea.includes('cloud-firestore-emulator') &&
    (linea.includes(PROYECTO) || linea.includes('--port 8080'))
  );
}

/**
 * El jar de reglas de Storage no lleva proyecto ni puerto en la línea de
 * comando, así que solo se reconoce por el nombre del jar.
 */
export function esEmuladorDeStorage(linea) {
  return linea.includes('cloud-storage-rules-runtime');
}

/**
 * Procesos java con su línea de comando, o `null` si no se pudo consultar
 * (sin `wmic` en Windows 11 se usa CIM; en el resto, `ps`).
 */
function listarProcesos(advertir) {
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
    advertir(`no se pudo listar procesos (${error.message}); se omite el barrido`);
    return null;
  }
}

function cerrarProceso(proceso, advertir) {
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

async function puertosOcupados(puertos) {
  const ocupados = [];
  for (const puerto of puertos) {
    if (await puertoOcupado(puerto)) {
      ocupados.push(puerto);
    }
  }
  return ocupados;
}

async function esperarPuertosLibres(puertos, msMaximo) {
  const limite = Date.now() + msMaximo;
  let ocupados = await puertosOcupados(puertos);
  while (ocupados.length > 0 && Date.now() < limite) {
    await new Promise((resolver) => setTimeout(resolver, 250));
    ocupados = await puertosOcupados(puertos);
  }
  return ocupados;
}

/** Corre `emulators:exec` con el comando de la suite. */
function correrPruebas({ only, comando, advertir }) {
  const firebase = requerir.resolve('firebase-tools/lib/bin/firebase.js');
  const argumentos = [
    firebase,
    'emulators:exec',
    '--config',
    'firebase.tienda.json',
    '--project',
    PROYECTO,
    '--only',
    only,
    comando,
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

function avisarPuertosAjenos(puertos, advertir) {
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

/**
 * Barre, levanta los emuladores, corre el comando y vuelve a barrer.
 * Devuelve el código de salida de las pruebas: la limpieza nunca lo cambia.
 */
export async function correrConEmuladores({
  prefijo,
  puertos,
  only,
  comando,
  esEmuladorPropio,
}) {
  const informar = (mensaje) => console.log(`${prefijo} ${mensaje}`);
  const advertir = (mensaje) => console.warn(`${prefijo} ${mensaje}`);

  /** Cierra los emuladores huérfanos de esta suite. Nunca es fatal. */
  const barrer = (momento) => {
    const procesos = listarProcesos(advertir);
    if (procesos === null) {
      return 0;
    }
    let cerrados = 0;
    for (const proceso of procesos.filter((p) =>
      esEmuladorPropio(p.comando.toLowerCase())
    )) {
      informar(
        `${momento}: cierro el emulador huérfano de la tienda (PID ${proceso.pid}).`
      );
      if (cerrarProceso(proceso, advertir)) {
        cerrados += 1;
      }
    }
    return cerrados;
  };

  try {
    barrer('pre-chequeo');
  } catch (error) {
    advertir(`falló el barrido previo (${error.message}); sigo igual`);
  }

  const ocupados = await esperarPuertosLibres(puertos, ESPERA_PREVIA_MS);
  if (ocupados.length > 0) {
    avisarPuertosAjenos(ocupados, advertir);
    return 1;
  }

  const codigo = await correrPruebas({ only, comando, advertir });

  // La limpieza nunca cambia el código de salida: manda el resultado de las
  // pruebas (criterio (c) del issue #70).
  try {
    barrer('limpieza');
    const siguenOcupados = await esperarPuertosLibres(puertos, ESPERA_LIMPIEZA_MS);
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

/** Corre una suite y termina el proceso con su código. */
export function ejecutar(opciones) {
  correrConEmuladores(opciones).then(
    (codigo) => process.exit(codigo),
    (error) => {
      console.warn(`${opciones.prefijo} error inesperado (${error.message})`);
      process.exit(1);
    }
  );
}
