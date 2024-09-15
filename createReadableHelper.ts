import { TextDecoder } from "util";
import Exception from "./Exception";
import child_process from "child_process";

export default function createReadableHelper(
  childProcess: child_process.ChildProcess,
  stdio: "stdout" | "stderr",
) {
  const readable = childProcess[stdio] ?? null;

  if (readable === null) {
    throw new Exception(`No ${stdio} stream`);
  }

  const chunks = new Array<Uint8Array>();

  /**
   * This promise will be resolved if the process exits with a
   * non-zero exit code.
   */
  const pendingReadable = new Promise<void>((resolve, reject) => {
    readable.on("data", (chunk) => {
      if (!Buffer.isBuffer(chunk)) {
        reject(new Exception(`Received a non-buffer chunk: ${chunk}`));
        return;
      }
      chunks.push(chunk);
    });
    readable.on("close", () => resolve());
  });

  /**
   * This promise will be resolved when the chunks have been concatenated.
   */
  const concatenatedChunks = pendingReadable.then(() => {
    const byteLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const view = new Uint8Array(byteLength);
    return chunks.reduce(
      (acc, chunk) => {
        acc.view.set(chunk, acc.offset);
        acc.offset += chunk.byteLength;
        return acc;
      },
      { view, offset: 0 },
    ).view;
  });

  const utf8 = async () => new TextDecoder().decode(await concatenatedChunks);
  const json = async <T = unknown>(): Promise<T> => {
    try {
      return JSON.parse(await utf8());
    } catch (reason) {
      throw new Exception(
        `Failed to parse JSON:\n\n` +
          `${(await utf8())
            .split("\n")
            .map((line) => `\t> ${line}`)
            .join("\n")}\n` +
          `Failed with error:\n\n` +
          `\t> ${reason}`,
      );
    }
  };

  return {
    json,
    utf8,
    raw: async () => Uint8Array.from(await concatenatedChunks),
  };
}
