import { Socket } from "net";
import { Writable } from "stream";
import timers from "timers";
import Exception from "../../Exception";

export default function waitWritableFinishEvents<T>(
  writable: Writable | Socket,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const runTimerId = timers.setTimeout(() => {
      resolve(fn());
    }, 0);

    const clear = () => {
      timers.clearTimeout(runTimerId);

      /**
       * Remove listeners, so that they are not called when the promise is resolved.
       */
      writable.removeListener("finish", onFinishStream);
      writable.removeListener("close", onCloseStream);
      writable.removeListener("error", onStreamError);
    };

    const onFinishStream = () => {
      clear();
      reject(new Exception("Stream has finished"));
    };

    const onCloseStream = () => {
      clear();
      reject(new Exception("Stream has closed"));
    };

    const onStreamError = (err: Error) => {
      clear();
      reject(err);
    };

    /**
     * Bind event listeners for listening just once
     */
    writable.prependOnceListener("error", onStreamError);
    writable.prependOnceListener("finish", onFinishStream);
    writable.prependOnceListener("close", onCloseStream);
  });
}
