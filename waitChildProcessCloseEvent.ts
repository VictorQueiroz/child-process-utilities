import child_process from "child_process";
import Exception from "./Exception";

export default function waitChildProcessCloseEvent(
  childProcess: child_process.ChildProcess,
) {
  return new Promise<void>((resolve, reject) => {
    childProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Exception(`Process exited with code: ${code}`));
      } else {
        resolve();
      }
    });
  });
}
