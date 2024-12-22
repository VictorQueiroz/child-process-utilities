import child_process from "child_process";
import Exception from "./Exception";
import waitStreamEvent from "./waitStreamEvent";

export default function waitChildProcessCloseEvent(
  childProcess: child_process.ChildProcess,
) {
  const closeEvent = new Promise<void>((resolve, reject) => {
    childProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Exception(`Process exited with code: ${code}`));
      } else {
        resolve();
      }
    });

    childProcess.on("error", (error) => {
      reject(error);
    });
  });

  return Promise.all([
    closeEvent,
    waitStreamEvent(childProcess.stdout, "end"),
    waitStreamEvent(childProcess.stdin, "end"),
    waitStreamEvent(childProcess.stderr, "end"),
  ]).then(() => {});
}
