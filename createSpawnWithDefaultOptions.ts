import createChildProcessReadableNullishStreamException from "./createChildProcessReadableNullishStreamException";
import createSerializer, { ISerializer } from "./createSerializer";
import createReadable, {
  IReadable,
  IReadableOptionTypes
} from "./stream/readable/createReadable";
import nonNullableOrException from "./nonNullableOrException";
import waitChildProcessCloseEvent from "./waitChildProcessCloseEvent";
import child_process from "child_process";
import createWritable, {
  CreateWritableOptions,
  IWritable
} from "./stream/writable/createWritable";
import { RingBufferU8 } from "ringbud";

export type SpawnCreateReadableOptions =
  | {
      ringBuffer: RingBufferU8;
    }
  | {
      frameSize: number;
    };

export interface IOptions extends child_process.SpawnOptions {
  /**
   * If true, it will log the entire command on the terminal before
   * spawning the process.
   */
  log?: boolean;
  /**
   * Serializer to use when reading the output of the child process.
   * If no serializer is provided, we will create a new serializer
   * every new process.
   */
  serializer?: ISerializer;
  /**
   * Ring buffer
   */
  ringBuffer?: RingBufferU8;
  /**
   * Frame size
   */
  frameSize?: number;
}

export interface ISpawnResult<T extends IReadableOptionTypes> {
  /**
   * Wait for the child process to exit. If the child process exits
   * with a non-zero exit code, an exception will be thrown.
   */
  wait: () => Promise<void>;
  childProcess: child_process.ChildProcess;
  stdin: (spawnCreateReadableOptions?: SpawnCreateReadableOptions | null) => IWritable;
  /**
   * Get the output streams of the child process.
   *
   * @returns An object with two properties: `stdout` and `stderr`.
   * Each property is a `ReadableStream` that outputs the corresponding
   * stream from the child process.
   */
  output: () => {
    stdout: () => IReadable<T>;
    stderr: () => IReadable<T>;
  };
  /**
   * Shortcut for `ChildProcess.kill()`.
   */
  kill: (signal?: NodeJS.Signals | number) => boolean;
  options: IOptions;
}

export interface ISpawn<T extends IReadableOptionTypes = IReadableOptionTypes> {
  (command: string, args?: string[], options?: IOptions): ISpawnResult<T>;
  defaultOptions: IOptions;
}

/**
 * Creates a function that spawns a new process with the given default options.
 * @param {IOptions} defaultOptions Default options to use when spawning a new process.
 * @returns {ISpawn} A function that takes a command, arguments, and options as parameters.
 * The function will return a `ISpawnResult` object with the following properties:
 *   - `wait`: A function that waits for the child process to exit. If the child process exits
 *     with a non-zero exit code, an exception will be thrown.
 *   - `childProcess`: The original Node.js @type {child_process.ChildProcess} instance that was spawned.
 *   - `output`: A function that returns an object with two properties: `stdout` and `stderr`.
 *     Each property is a function that returns a @type {IReadable} that acts as an interface to the readable stream.
 */
export default function createSpawnWithDefaultOptions<
  T extends IReadableOptionTypes = IReadableOptionTypes
>(defaultOptions: IOptions): ISpawn<T> {
  function spawnChildProcess(
    command: string,
    args: string[] = [],
    options: IOptions = {}
  ) {
    if (options.log) {
      console.log("$ %s %s", command, args.join(" "));
    }
    options = {
      ...defaultOptions,
      ...options
    };

    /**
     * Inherit `stderr` descriptor by default to avoid missing errors.
     */
    if (typeof options.stdio === "string") {
      options.stdio = ["pipe", options.stdio, "inherit"];
    }

    const childProcess = child_process.spawn(command, args, options);
    const wait = () => waitChildProcessCloseEvent(childProcess);
    const serializer = createSerializer();
    const output = () => ({
      stdout: () =>
        nonNullableOrException(
          childProcess.stdout
            ? { readable: childProcess.stdout, serializer }
            : null,
          createReadable,
          createChildProcessReadableNullishStreamException("stdout")
        ),
      stderr: () =>
        nonNullableOrException(
          childProcess.stderr
            ? { readable: childProcess.stderr, serializer }
            : null,
          createReadable,
          createChildProcessReadableNullishStreamException("stderr")
        )
    });

    const kill = (signal?: NodeJS.Signals | number): boolean => {
      return childProcess.kill(signal);
    };

    const stdin = (
      spawnCreateReadableOptions: SpawnCreateReadableOptions | null = null
    ) => {
      const writable = childProcess.stdin;
      if (writable === null) {
        throw createChildProcessReadableNullishStreamException("stdin");
      }
      if (spawnCreateReadableOptions === null) {
        return createWritable({
          frameSize: options.frameSize ?? 1024,
          writable
        });
      }
      let writableOptions: CreateWritableOptions;
      if ("ringBuffer" in spawnCreateReadableOptions) {
        writableOptions = {
          ringBuffer: spawnCreateReadableOptions.ringBuffer,
          writable
        };
      } else {
        writableOptions = {
          frameSize: spawnCreateReadableOptions.frameSize,
          writable
        };
      }

      return createWritable(writableOptions);
    };

    const result: ISpawnResult<T> = {
      options,
      stdin,
      wait,
      /**
       * Original Node.js @type {child_process.ChildProcess} instance that was spawned.
       */
      childProcess,
      kill,
      output
    };

    return result;
  }

  spawnChildProcess.defaultOptions = defaultOptions;

  spawnChildProcess.createWritable = createWritable;

  return spawnChildProcess;
}
