import Exception from "./Exception";

/**
 * Creates an exception that is thrown when trying to access either the stderr or
 * stdout stream of a child process but the stream is nullish. This is a sign that
 * the child process was not configured correctly.
 *
 * @param streamName The name of the stream that was nullish. Either "stderr" or
 * "stdout".
 * @returns An exception that is thrown.
 */
export default function createChildProcessReadableNullishStreamException(
  streamName: "stderr" | "stdout",
) {
  return new Exception(
    `No ${streamName} stream. Maybe you forgot to configure the \`stdio\` option? See: https://nodejs.org/api/child_process.html#optionsstdio`,
  );
}
