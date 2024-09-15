import child_process from "child_process";
import waitChildProcessCloseEvent from "./waitChildProcessCloseEvent";
import createReadableHelper from "./createReadableHelper";

export interface IOptions extends child_process.SpawnOptions {
  log?: boolean;
}

export function spawn(
  command: string,
  args: string[] = [],
  options: IOptions = {},
) {
  if (options.log ?? true) {
    console.log("$ %s %s", command, args.join(" "));
  }
  const childProcess = child_process.spawn(command, args, {
    stdio: "inherit",
    ...options,
  });
  const wait = () => waitChildProcessCloseEvent(childProcess);
  return {
    /**
     * Wait for the child process to exit. If the child process exits
     * with a non-zero exit code, an exception will be thrown.
     */
    wait,
    /**
     * Original Node.js @type {child_process.ChildProcess} instance that was spawned.
     */
    childProcess,
    /**
     * Get the output streams of the child process.
     *
     * @returns An object with two properties: `stdout` and `stderr`.
     * Each property is a `ReadableStream` that outputs the corresponding
     * stream from the child process.
     */
    output: () => ({
      stdout: createReadableHelper(childProcess, "stdout"),
      stderr: createReadableHelper(childProcess, "stderr"),
    }),
  };
}
