import { Socket } from "net";
import { Writable } from "stream";
import { RingBufferU8 } from "ringbud";
import Exception from "../../Exception";
import waitWritableFinishEvents from "./waitWritableFinishEvents";

export type CreateWritableOptions =
  | ICreateWritableOptionsWithRingBuffer
  | ICreateWritableOptionsWithFrameSize;

export interface ICreateWritableOptionsBase {
  writable: Writable | Socket;
}

export interface ICreateWritableOptionsWithFrameSize
  extends ICreateWritableOptionsBase {
  /**
   * If we want to define a specific frame size for how
   * the output is going to be written to the stream,
   * we can use this property.
   */
  frameSize: number;
}

export interface ICreateWritableOptionsWithRingBuffer
  extends ICreateWritableOptionsBase {
  ringBuffer: RingBufferU8;
}

export interface IWritable {
  needsDrain(): boolean;

  wait(): Promise<void>;

  /**
   * All the remaining data in the ring buffer will be written
   * to the stream, and the ring buffer will be flushed. This is basically
   * a way to ignore whatever frame size was used in the ring buffer.
   */
  flush(): void;

  write(chunk: Uint8Array): void;

  end(): Promise<void>;
  end(chunk: Uint8Array): Promise<void>;
  end(chunk: Uint8Array, encoding: BufferEncoding): Promise<void>;
}

export default function createWritable(
  options: CreateWritableOptions
): IWritable {
  const { writable } = options;

  let ringBuffer: RingBufferU8;
  if ("ringBuffer" in options) {
    ringBuffer = options.ringBuffer;
  } else {
    const frameSize = Math.min(
      writable.writableHighWaterMark,
      options.frameSize
    );

    if (frameSize !== options.frameSize) {
      console.error(
        "Ring buffer frame size is higher than the stream high water mark. " +
          "The stream high water mark is: %d and the ring buffer frame size is: %d",
        writable.writableHighWaterMark,
        frameSize
      );
    }
    ringBuffer = new RingBufferU8(frameSize);
  }

  let drainRingBuffer = false;
  let pending = Promise.resolve();
  let drain: Promise<void> | null = null;

  const shouldSendFrame = () => !waitingDrain() && !ringBuffer.empty();
  const ended = () =>
    writable.writableEnded || writable.writableFinished || writable.destroyed;
  const waitingDrain = () => drain !== null || writable.writableNeedDrain;

  const watchDrainEvent = () => {
    /**
     * If there is a pending drain event, we should not
     * create a new one.
     */
    if (drain !== null) {
      return;
    }

    drain = waitWritableFinishEvents(
      writable,
      () =>
        new Promise<void>((resolve) => {
          writable.prependOnceListener("drain", () => {
            resolve();
          });
        })
    );

    const pendingDrain = drain;

    pending = Promise.all([pending, pendingDrain])
      .then(() => {})
      .finally(() => {
        if (pendingDrain !== drain) {
          console.error(
            "Finally was called with pendingDrain !== drain. " +
              "The expected is that `finally` should be called before any more writes occur."
          );
          return;
        }

        drain = null;
        checkWritableStatus();
      });
  };

  const checkWritableStatus = function () {
    if (ended() || !shouldSendFrame()) {
      return;
    }

    if (waitingDrain()) {
      watchDrainEvent();
    } else {
      sendFrame();
    }
  };

  const readFrame = () => {
    const frame = drainRingBuffer
      ? /**
         * Drain the buffer if `drainRingBuffer` is true
         */
        ringBuffer.drain()
      : ringBuffer.read();

    if (frame === null) {
      return null;
    }

    /**
     * If `ringBuffer.write` is called and this
     * function is called afterwards, there will be data corruption.
     * That's why we need to wait for the write to finish before
     * moving forward.
     */
    const rollback = () => {
      const trailingSlice = ringBuffer.drain();
      ringBuffer.write(frame);
      if (trailingSlice !== null) {
        ringBuffer.write(trailingSlice);
      }
    };

    return { frame, rollback };
  };

  const end = (
    chunk: Uint8Array | undefined | null = null,
    encoding: BufferEncoding | undefined | null = null
  ) => {
    return waitWritableFinishEvents(
      writable,
      () =>
        new Promise<void>((resolve, reject) => {
          if (chunk === null) {
            writable.end(resolve);
            return;
          }
          try {
            if (encoding !== null) {
              if ("resume" in writable) {
                writable.end(chunk, encoding, resolve);
              } else {
                writable.end(chunk, encoding, resolve);
              }
            } else {
              writable.end(chunk, resolve);
            }
          } catch (reason) {
            reject(reason);
          }
        })
    );
  };

  const flush = () => {
    if (drainRingBuffer) {
      return;
    }

    drainRingBuffer = true;
    checkWritableStatus();
  };

  const sendFrame = function () {
    pending = pending
      .then(async () => {
        /**
         * If we're waiting for the drain event or
         * the ring buffer is empty, we should not
         * send a frame.
         */
        if (!shouldSendFrame()) {
          return;
        }

        const result = readFrame();

        if (result === null) {
          console.log("Failed to find frame: %o", result);
          return;
        }
        try {
          await writeAsync(result.frame);
        } catch (err) {
          result.rollback();
        }

        // console.log('Successfully sent frame: %o', result);
      })
      .catch((err) => {
        console.error("Failed to send frame", err);
      })
      .finally(() => {
        checkWritableStatus();
      });
  };

  const writeAsync = async function (chunk: Uint8Array) {
    return new Promise<void>((resolve, reject) => {
      const callback = function (err: Error | undefined | null = null) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      let result: boolean;

      if ("resume" in writable) {
        result = writable.write(chunk, callback);
      } else {
        result = writable.write(chunk);
      }

      if (!result) {
        reject(new Exception("Failed to write frame"));
      }
    });
  };

  const write = function (chunk: Uint8Array | null = null) {
    if (chunk !== null) {
      ringBuffer.write(chunk);
    }

    checkWritableStatus();
  };

  const wait = () => waitWritableFinishEvents(writable, () => pending);

  return Object.freeze(
    Object.seal({ needsDrain: () => waitingDrain(), flush, wait, write, end })
  );
}
