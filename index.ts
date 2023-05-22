import child_process from "child_process";

export class Exception {
  public constructor(public readonly what = "") {}
}

export function spawn(
  command: string,
  args: string[] = [],
  options: child_process.SpawnOptionsWithoutStdio = {}
) {
  const childProcess = child_process.spawn(command, args, {
    stdio: "inherit",
    ...options,
  });
  return {
    wait: () =>
      new Promise<void>((resolve, reject) => {
        childProcess.on("close", (code) => {
          if (code !== 0) {
            reject(new Exception(`Process exited with code: ${code}`));
          } else {
            resolve();
          }
        });
      }),
    childProcess,
  };
}
