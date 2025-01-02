import { TextDecoder } from "util";
import Exception from "../../Exception";
import errorToString from "../../errorToString";
import createSerializer, { ISerializer } from "../../createSerializer";
import { Readable } from "stream";

/**
 * Interface representing the option types for `IReadable`.
 * This can be extended to customize the expected return type for the `json()` method.
 */
export interface IReadableOptionTypes {
  json: unknown;
}

/**
 * Utility type to extract the type of the `json` property from `IReadableOptionTypes`.
 */
type ReadableOptionValue<T extends IReadableOptionTypes> = T extends {
  json: infer U;
}
  ? U
  : never;

/**
 * Helper interface for processing a `Readable` stream.
 * Provides methods to read, decode, parse, and iterate over the data from the stream.
 * @template T Option types to customize the helper behavior, such as the expected JSON type.
 */
export interface IReadable<
  T extends IReadableOptionTypes = IReadableOptionTypes
> {
  /**
   * Reads the entire stream and returns the concatenated data as a `Uint8Array`.
   * **Note**: This method caches the entire output in memory, but does so efficiently
   * using a dynamic-memory serializer.
   * @returns {Promise<Uint8Array>} A promise that resolves to the raw data from the stream.
   */
  raw: () => Promise<Uint8Array>;
  /**
   * Reads and decodes the stream data into a string using the specified encoding.
   * @param {string} [encoding='UTF-8'] The encoding to use for decoding the data.
   * @returns {Promise<string>} A promise that resolves to the decoded string.
   */
  decode: (encoding?: string) => Promise<string>;
  /**
   * Reads and parses the stream data as JSON.
   * @template T The expected return type after parsing JSON.
   * @returns {Promise<T>} A promise that resolves to the parsed JSON object.
   * @throws {Exception} Throws an exception if parsing fails, including the error message and the data.
   */
  json<R = ReadableOptionValue<T>>(): Promise<R>;
  /**
   * Async generator function that splits the stream data using a delimiter and yields each part.
   * This function processes data chunk by chunk without caching the entire stream in memory.
   * @param {string} delimiter The delimiter to split the data on.
   * @returns {AsyncGenerator<string>} An async generator yielding each split string.
   * @throws {Exception} Throws an exception if a non-buffer chunk is encountered.
   */
  split: (delimiter: string) => AsyncIterableIterator<string>;
  /**
   * Async iterator over the data chunks from the stream, yielding `Uint8Array` chunks.
   * @returns {AsyncIterableIterator<Uint8Array>} An async iterator over the data chunks.
   * @throws {Exception} Throws an exception if a non-buffer chunk is encountered.
   */
  [Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array>;
}

export interface ICreateReadableOptions {
  readable: Readable;
  serializer: ISerializer;
}

/**
 * Creates a helper object for a given `Readable` stream.
 * Provides utility methods to read, decode, parse, and iterate over the stream data.
 * @param {Readable | null} readable The `Readable` stream to process.
 * @returns {IReadable} An object implementing the `IReadable` interface.
 * @throws {Exception} Throws an exception if the `readable` argument is `null`.
 */
export default function createReadable({
  serializer,
  readable
}: ICreateReadableOptions): IReadable {
  /**
   * This promise will be resolved when the chunks have been concatenated.
   * This method caches the entire output in memory, but it does so in an
   * intelligent way, by using a dynamic-memory serializer.
   */
  const raw = async function () {
    // Reset the serializer
    serializer.rewind();

    for await (const chunk of readable) {
      serializer.write(chunk);
    }

    return serializer.view();
  };

  /**
   * Decode the entire output to a string. Defaults to UTF-8.
   * @param encoding Encoding to use (see [4. Encodings](https://encoding.spec.whatwg.org/#encodings))
   * @returns {Promise<string>} Decoded string
   */
  const decode = async function (encoding: string = "UTF-8"): Promise<string> {
    return new TextDecoder(encoding).decode(await raw());
  };

  const json = async <T = unknown>(): Promise<T> => {
    try {
      const decoded = await decode("UTF-8");
      return JSON.parse(decoded);
    } catch (reason) {
      const message = errorToString(reason);
      throw new Exception(
        `Failed to parse JSON:\n\n` +
          `${(await decode())
            .split("\n")
            .map((line) => `\t> ${line}`)
            .join("\n")}\n` +
          `Failed with error:\n\n` +
          `\t> ${message}`
      );
    }
  };

  const split = async function* (
    delimiter: string
  ): AsyncIterableIterator<string> {
    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of readable) {
      if (chunk && !Buffer.isBuffer(chunk)) {
        throw new Exception(
          `Received a non-buffer chunk: ${chunk} (type: ${typeof chunk})`
        );
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

  async function* asyncIterator() {
    for await (const chunk of readable) {
      if (!Buffer.isBuffer(chunk)) {
        throw new Exception(
          `Received a non-buffer chunk: ${chunk} (type: ${typeof chunk}). ` +
            "This method is supposed to return a buffer. Maybe you changed the stream encoding? " +
            "See: https://nodejs.org/api/stream.html#readablesetencodingencoding"
        );
      }
      yield new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    }
  }

  return {
    [Symbol.asyncIterator]: asyncIterator,
    split,
    json,
    decode,
    raw
  };
}
