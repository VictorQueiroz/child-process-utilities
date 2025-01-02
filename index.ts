import { ChildProcess } from "child_process";
import { IReadableOptionTypes } from "./stream/readable/createReadable";
import createSpawnWithDefaultOptions, {
  IOptions,
  ISpawnResult
} from "./createSpawnWithDefaultOptions";
import mergeOptions from "./mergeSpawnOptions";
import createWritable from "./stream/writable/createWritable";

const defaultSpawn = createSpawnWithDefaultOptions({
  stdio: "inherit",
  log: true
});

const silentSpawn = createSpawnWithDefaultOptions({
  log: false
});

export function silent<T extends IReadableOptionTypes>(
  command: string,
  args: string[] = [],
  options: IOptions = {}
): ISpawnResult<T> {
  return silentSpawn(command, args, options);
}

export function spawn<T extends { json: unknown }>(
  command: string,
  args: string[] = [],
  options: IOptions = {}
): ISpawnResult<T> {
  return defaultSpawn(command, args, options);
}

const pipeSpawn = mergeOptions(
  defaultSpawn,
  createSpawnWithDefaultOptions({
    stdio: "pipe"
  })
);

/**
 * Similar to `spawn`, but pipes the output instead of printing it to the
 * console (stdio: 'pipe'). This is useful when you want to process the output
 * programatically.
 *
 * @param command The command to spawn.
 * @param args The list of arguments to pass to the command.
 * @param options The options to use when spawning the process.
 * @returns A promise that resolves when the process has finished.
 */
export function pipe(
  command: string,
  args: string[] = [],
  options: IOptions = {}
) {
  return pipeSpawn(command, args, options);
}

pipe.silent = mergeOptions(pipeSpawn, silentSpawn);

spawn.pipe = pipe;

const waitSpawn = mergeOptions(
  defaultSpawn,
  createSpawnWithDefaultOptions({
    stdio: "ignore"
  })
);

export interface IWaitOptions extends IOptions {
  /**
   * If `true`, an exception will not be thrown if the child process exits with a non-zero exit code.
   * Instead, the promise will simply be resolved with the child process.
   */
  noThrow?: boolean;
}

/**
 * Similar to `spawn`, but calls the `wait` method on the result immediately.
 * This function does not use the `stdout` or `stderr` streams unless
 * `options.stdio` is set to `inherit`. In this case, the `stdout` and `stderr`
 * readable streams of the child process will inherit the current `process.stdout`
 * and `process.stderr` readable streams.
 *
 * If `options.log` is set to `false`, the spawned command will not be printed to the console.
 *
 * @param command The command to spawn.
 * @param args The list of arguments to pass to the command.
 * @param options The options to use when spawning the process.
 * @returns {Promise<import('child_process').ChildProcess>} A promise that resolves when the process has finished, and returns the original Node.js `ChildProcess` instance.
 */
export async function wait(
  command: string,
  args: string[] = [],
  { noThrow = false, ...options }: IWaitOptions = {}
): Promise<ChildProcess> {
  const childProcess = waitSpawn(command, args, options);

  try {
    await childProcess.wait();
  } catch (reason) {
    if (noThrow) {
      if (childProcess.options.log) {
        console.error(reason);
      }
    } else {
      throw reason;
    }
  }

  return childProcess.childProcess;
}

spawn.wait = wait;

export { default as createWritable } from "./stream/writable/createWritable";
export { default as createReadable } from "./stream/readable/createReadable";
