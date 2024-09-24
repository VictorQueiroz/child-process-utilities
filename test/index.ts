import { describe, it } from "node:test";
import { spawn } from "..";
import path from "node:path";
import assert from "node:assert";

describe("spawn", () => {
  describe("wait", () => {
    it("should wait for the child process to exit", async (t) => {
      const result = await spawn.wait("sh", [
        path.resolve(__dirname, "stream1.sh"),
      ]);
      assert.strict.ok(result.exitCode === 0);
    });

    it("should not throw if `noThrow` is set to true", async (t) => {
      const result = await spawn.wait("sh", ["-c", "exit 1"], {
        noThrow: true,
      });
      assert.strict.ok(result.exitCode === 1);
    });

    it("should throw if `noThrow` is set to false", async (t) => {
      await t.assert.rejects(
        () =>
          spawn.wait("sh", ["-c", "exit 1"], {
            noThrow: false,
          }),
        {
          what: "Process exited with code: 1",
        },
      );
    });

    it("should catch a process that exits with exit code 255", async (t) => {
      await t.assert.rejects(
        () =>
          spawn.wait("sh", ["-c", "exit 255"], {
            noThrow: false,
          }),
        {
          what: "Process exited with code: 255",
        },
      );
    });

    it("should throw by default", async (t) => {
      await t.assert.rejects(() => spawn.wait("sh", ["-c", "exit 1"]), {
        what: "Process exited with code: 1",
      });
    });
  });
  describe("output", () => {
    describe("stdout", () => {
      describe("json", () => {
        it("should decode stream as a JSON object", async (t) => {
          t.assert.deepEqual(
            await spawn
              .pipe("sh", [path.resolve(__dirname, "stream-json.sh")])
              .output()
              .stdout()
              .json(),
            (await import("./expected-streamed-json.json")).default,
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
            "Loop 5",
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
