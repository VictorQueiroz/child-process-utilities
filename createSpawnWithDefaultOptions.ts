import createChildProcessReadableNullishStreamException from "./createChildProcessReadableNullishStreamException";
import createReadableHelper, {
  IReadableHelper,
  IReadableHelperOptionTypes,
} from "./createReadableHelper";
import nonNullableOrException from "./nonNullableOrException";
import waitChildProcessCloseEvent from "./waitChildProcessCloseEvent";
import child_process from "child_process";

export interface IOptions extends child_process.SpawnOptions {
  /**
   * If true, it will log the entire command on the terminal before
   * spawning the process.
   */
  log?: boolean;
}

export interface ISpawnResult<T extends IReadableHelperOptionTypes> {
  /**
   * Wait for the child process to exit. If the child process exits
   * with a non-zero exit code, an exception will be thrown.
   */
  wait: () => Promise<void>;
  childProcess: child_process.ChildProcess;
  /**
   * Get the output streams of the child process.
   *
   * @returns An object with two properties: `stdout` and `stderr`.
   * Each property is a `ReadableStream` that outputs the corresponding
   * stream from the child process.
   */
  output: () => {
    stdout: () => IReadableHelper<T>;
    stderr: () => IReadableHelper<T>;
  };
  options: IOptions;
}

export interface ISpawn<
  T extends IReadableHelperOptionTypes = IReadableHelperOptionTypes,
> {
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
 *     Each property is a function that returns a @type {IReadableHelper} that acts as an interface to the readable stream.
 */
export default function createSpawnWithDefaultOptions<
  T extends IReadableHelperOptionTypes = IReadableHelperOptionTypes,
>(defaultOptions: IOptions): ISpawn<T> {
  function spawnChildProcess(
    command: string,
    args: string[] = [],
    options: IOptions = {},
  ) {
    if (options.log) {
      console.log("$ %s %s", command, args.join(" "));
    }
    options = {
      ...defaultOptions,
      ...options,
    };
    const childProcess = child_process.spawn(command, args, options);
    const wait = () => waitChildProcessCloseEvent(childProcess);
    const output = () => ({
      stdout: () =>
        nonNullableOrException(
          childProcess.stdout,
          createReadableHelper,
          createChildProcessReadableNullishStreamException("stdout"),
        ),
      stderr: () =>
        nonNullableOrException(
          childProcess.stderr,
          createReadableHelper,
          createChildProcessReadableNullishStreamException("stderr"),
        ),
    });
    return {
      options,
      wait,
      /**
       * Original Node.js @type {child_process.ChildProcess} instance that was spawned.
       */
      childProcess,
      output,
    };
  }

  spawnChildProcess.defaultOptions = defaultOptions;

  return spawnChildProcess;
}
