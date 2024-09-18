
export interface ISerializer {
  /**
   * Get the view of the buffer
   * @returns {Uint8Array} The view of the buffer sliced to the written data
   */
  view: () => Uint8Array;
  /**
   * Write data to the buffer
   * @param chunk The data to write
   * @returns {void}
   */
  write: (chunk: Uint8Array) => void;
  /**
   * Rewind the buffer
   * @param length The number of bytes to rewind
   * @returns {void}
   */
  rewind: (length?: number) => void;
}


/**
 * Create a serializer that can be used to write chunks of data to an
 * ArrayBuffer and rewind to a previous position.
 *
 * The serializer will automatically resize the ArrayBuffer as needed.
 *
 * The serializer is implemented as a closure that returns an object with
 * the following methods:
 * * `view`: Get the view of the buffer
 * * `write`: Write data to the buffer
 * * `rewind`: Rewind the buffer
 *
 * @returns {ISerializer} An object with the methods described above
 */
export default function createSerializer(): ISerializer {
  // Create an initial buffer of 65,536 bytes
  let initialSize = 256 * 256 * 1;
  let offset = 0;
  let buffer = new ArrayBuffer(initialSize);
  let view = new Uint8Array(buffer, 0, offset);

  const write = function (chunk: Uint8Array) {
    const remaining = buffer.byteLength - offset;
    // If we don't have enough space in the buffer, we need to resize it
    if (remaining < chunk.byteLength) {
      // Create a new buffer with twice the size
      const newBuffer = new ArrayBuffer(buffer.byteLength + (initialSize * 2) + chunk.byteLength);
      const newView = new Uint8Array(newBuffer, 0, offset + chunk.byteLength);

      // Move the old memory to the new buffer
      newView.set(view, 0);

      // Set the new data in the new buffer
      newView.set(chunk, offset);

      // Update the view and buffer
      view = newView;
      buffer = newBuffer;
    } else {
      new Uint8Array(buffer, offset, chunk.byteLength).set(chunk);
    }
    offset += chunk.byteLength;
  };

  const rewind = function (length = offset) {
    offset = Math.max(0, offset - length);
  };

  return {
    view: () => new Uint8Array(buffer, 0, offset),
    rewind,
    write,
  }
}
