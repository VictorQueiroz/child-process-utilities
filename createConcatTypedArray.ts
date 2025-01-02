export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | Uint8ClampedArray;

export type TypedArrayConstructor<T extends TypedArray> = {
  new (length: number): T;
};

/**
 * Concatenates @type {T[]} into a single @type {T}.
 */
export interface IConcatTypedArray<T extends TypedArray> {
  (...chunks: T[]): T;
}

/**
 * Takes a TypedArray constructor and returns a function that
 * only accepts a list of instances of the given constructor.
 * @param {TypedArrayConstructor<T>} ViewConstructor
 * @returns {IConcatTypedArray<T>}
 */
export default function createConcatTypedArray<T extends TypedArray>(
  ViewConstructor: TypedArrayConstructor<T>
): IConcatTypedArray<T> {
  return function (...chunks) {
    const byteLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const view = new ViewConstructor(byteLength);
    const result = chunks.reduce(
      (acc, chunk) => {
        acc.view.set(chunk, acc.offset);
        acc.offset += chunk.byteLength;
        return acc;
      },
      { view, offset: 0 }
    );

    return result.view;
  };
}
