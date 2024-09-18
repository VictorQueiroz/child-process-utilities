import { TextDecoder } from "util";
import Exception from "./Exception";
import child_process from "child_process";
import errorToString from "./errorToString";
import createSerializer from "./createSerializer";
import assert from "assert";

export interface IReadableHelper {
  raw: () => Promise<Uint8Array>;
  json<T = unknown>(): Promise<T>;
  decode: (encoding?: string) => Promise<string>;
  split: (delimiter: string) => AsyncIterableIterator<string>;
}

export default function createReadableHelper(
  childProcess: child_process.ChildProcess,
  stdio: "stdout" | "stderr",
): IReadableHelper {
  const readable = childProcess[stdio] ?? null;

  if (readable === null) {
    throw new Exception(`No ${stdio} stream`);
  }

  const serializer = createSerializer();

  /**
   * This promise will be resolved when the chunks have been concatenated.
   */
  const raw = (async function () {
    // Reset the serializer
    serializer.rewind();

    for await(const chunk of readable) {
      serializer.write(chunk);
    }

    return serializer.view();
  })();

  /**
   * Decode the entire output to a string. Defaults to UTF-8.
   * @param encoding Encoding to use (see [4. Encodings](https://encoding.spec.whatwg.org/#encodings))
   * @returns {Promise<string>} Decoded string
   */
  const decode = async function(encoding: string = 'UTF-8'): Promise<string> {
    return new TextDecoder(encoding).decode(await raw);
  };

  const json = async <T = unknown>(): Promise<T> => {
    try {
      console.log(await decode('UTF-8'))
      return JSON.parse(await decode('UTF-8'));
    } catch (reason) {
      const message = errorToString(reason);
      throw new Exception(
        `Failed to parse JSON:\n\n` +
          `${(await decode())
            .split("\n")
            .map((line) => `\t> ${line}`)
            .join("\n")}\n` +
          `Failed with error:\n\n` +
          `\t> ${message}`,
      );
    }
  };

  const split = async function* (delimiter: string): AsyncGenerator<string> {
    const decoder = new TextDecoder();
    let buffer = '';
  
    for await (const chunk of readable) {
      if (!Buffer.isBuffer(chunk)) {
        throw new Exception(`Received a non-buffer chunk: ${chunk} (type: ${typeof chunk})`);
      }
  
      // Decode the chunk and append it to the buffer
      buffer += decoder.decode(chunk, { stream: true });
  
      let delimiterIndex;
      // Look for the delimiter in the buffer
      while ((delimiterIndex = buffer.indexOf(delimiter)) >= 0) {
        // Extract the data before the delimiter
        const item = buffer.slice(0, delimiterIndex);
        // Yield the item
        yield item;
        // Update the buffer to remove the processed data and delimiter
        buffer = buffer.slice(delimiterIndex + delimiter.length);
      }
    }
  
    // Handle any remaining data in the buffer
    if (buffer.length > 0) {
      yield buffer;
    }
  };
  
  return {
    split,
    json,
    decode,
    raw: () => raw
  };
}
