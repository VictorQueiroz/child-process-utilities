import sinon from "sinon";
import { describe, it } from "node:test";
import { createWritable, spawn } from "..";
import path from "node:path";
import assert from "node:assert";
import timers from "timers";
import { RingBufferU8 } from "ringbud";
import { PassThrough } from "node:stream";

describe("createWritable", () => {
  it("should recover from a stream overflow", async () => {
    const write = sinon.spy(function (
      chunk: any,
      encoding: BufferEncoding,
      callback: (error?: Error | null) => void
    ): void {
      timers.setTimeout(() => {
        callback(null);
      }, 10);
    });
    const dest = new PassThrough({
      write,
      highWaterMark: 32
    });
    const writable = createWritable({
      writable: dest,
      ringBuffer: new RingBufferU8(16)
    });

    const buffer = crypto.getRandomValues(new Uint8Array(256));

    writable.flush();
    writable.write(
      /**
       * Clone the buffer, to make sure it won't be changed.
       */
      buffer.slice(0)
    );

    await writable.wait();

    assert.strict.ok(writable.needsDrain());

    writable.end();

    await writable.wait();

    assert.strict.ok(!writable.needsDrain());
  });

  describe("Frame size", () => {
    it("should stick to the defined frame size", async () => {
      const write = sinon.spy(function (
        chunk: any,
        encoding: BufferEncoding,
        callback: (error?: Error | null) => void
      ): void {
        callback(null);
      });
      const dest = new PassThrough({
        write,
        highWaterMark: 256
      });
      const writable = createWritable({
        writable: dest,
        ringBuffer: new RingBufferU8(128)
      });
      const buffer = crypto.getRandomValues(new Uint8Array(256));

      writable.write(
        /**
         * Clone the buffer, to make sure it won't be changed.
         */
        buffer.slice(0)
      );

      await writable.wait();

      assert.strict.equal(write.callCount, 2);
      const call1 = write.getCall(0);
      assert.strict.deepEqual(call1.args, [
        Buffer.from(buffer.subarray(0, 128)),
        "buffer",
        call1.args[2]
      ]);
      // assert.strict.deepEqual(write.calledWith(buffer.subarray(128)), [buffer.subarray(128)])
    });
  });
});
describe("spawn", () => {
  describe("wait", () => {
    it("should wait for the child process to exit", async (t) => {
      const result = await spawn.wait("sh", [
        path.resolve(__dirname, "stream1.sh")
      ]);
      assert.strict.ok(result.exitCode === 0);
    });

    it("should not throw if `noThrow` is set to true", async (t) => {
      const result = await spawn.wait("sh", ["-c", "exit 1"], {
        noThrow: true
      });
      assert.strict.ok(result.exitCode === 1);
    });

    it("should throw if `noThrow` is set to false", async (t) => {
      await t.assert.rejects(
        () =>
          spawn.wait("sh", ["-c", "exit 1"], {
            noThrow: false
          }),
        {
          what: "Process exited with code: 1"
        }
      );
    });

    it("should catch a process that exits with exit code 255", async (t) => {
      await t.assert.rejects(
        () =>
          spawn.wait("sh", ["-c", "exit 255"], {
            noThrow: false
          }),
        {
          what: "Process exited with code: 255"
        }
      );
    });

    it("should throw by default", async (t) => {
      await t.assert.rejects(() => spawn.wait("sh", ["-c", "exit 1"]), {
        what: "Process exited with code: 1"
      });
    });
  });

  describe("output", () => {
    describe("stdout", () => {
      it("should be an async iterator", async () => {
        const items = [
          "apple",
          "banana",
          "cherry",
          "date",
          "eggfruit",
          "fig",
          "grape",
          "honeydew",
          "kiwi",
          "lemon",
          "lime",
          "mango",
          "nectarine",
          "orange",
          "peach",
          "pear",
          "pineapple",
          "quince",
          "raspberry",
          "strawberry",
          "tangerine"
        ];
        const textDecoder = new TextDecoder();
        const itemsOutput = items.join(",");
        let offset = 0;
        for (const duration of [125, 250, 500].map((n) => `${n / 1000}s`)) {
          offset = 0;
          for await (const chunk of spawn
            .pipe(path.resolve(__dirname, "sleeping-stream.sh"), [...items], {
              env: {
                ...process.env,
                DURATION: duration
              }
            })
            .output()
            .stdout()) {
            const item = textDecoder.decode(chunk);

            assert.strict.equal(
              itemsOutput.substring(offset, offset + item.length),
              item
            );
            offset += item.length;
          }
        }
      });

      describe("json", () => {
        it("should decode stream as a JSON object", async (t) => {
          t.assert.deepEqual(
            await spawn
              .pipe("sh", [path.resolve(__dirname, "stream-json.sh")])
              .output()
              .stdout()
              .json(),
            (await import("./expected-streamed-json.json")).default
          );
        });
      });
      describe("split", () => {
        it("should split by line", async (t) => {
          const expectedLines: string[] = [
            "Loop 1",
            "Loop 2",
            "Loop 3",
            "Loop 4",
            "Loop 5"
          ];
          const outputLines = new Array<string>();
          for await (const line of spawn
            .pipe("sh", [path.resolve(__dirname, "stream1.sh")])
            .output()
            .stdout()
            .split("\n")) {
            outputLines.push(line);
          }
          t.assert.deepEqual(outputLines, expectedLines);
        });
      });
    });
  });
});
