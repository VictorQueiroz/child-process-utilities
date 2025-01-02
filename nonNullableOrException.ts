import Exception from "./Exception";

/**
 * If `value` is null or undefined, throws `exception`.
 * Otherwise, passes `value` to `bake` and returns the result.
 * @param value The value to check.
 * @param bake A function that takes `value` and returns a result.
 * @param exception The exception to throw if `value` is null or undefined.
 * @returns The result of `bake` or throws `exception`.
 */
export default function nonNullableOrException<T, R>(
  value: T | null,
  bake: (value: T) => R,
  exception: Exception
): R {
  if (value === null) {
    throw exception;
  }
  return bake(value);
}
