import { Readable, Writable } from "stream";
import Exception from "./Exception";

export default function waitStreamEvent(stream: Writable | Readable | null, event: 'end') {
  if (stream === null) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    if(event !== 'end') {
      throw new Exception(`Unknown event: ${event}`);
    }

    stream.on('end', () => {
      resolve();
    });

    stream.on('close', () => {
      resolve();
    });

    stream.on('error', (error) => {
      reject(error);
    });

    stream.on('finish', () => {
      resolve();
    });
  });
}

