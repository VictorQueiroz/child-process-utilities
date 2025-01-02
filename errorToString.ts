export default function errorToString(reason: unknown) {
  let message: string;

  if (reason instanceof Error) {
    // Handle standard Error objects
    message = reason.message;
  } else if (
    typeof reason === "object" &&
    reason !== null &&
    "message" in reason &&
    typeof reason["message"] === "string"
  ) {
    // Handle objects with a message property
    message = reason["message"];
  } else if (typeof reason === "string" || typeof reason === "number") {
    // Handle string and number primitives
    message = `${reason}`;
  } else if (
    typeof reason === "object" &&
    reason !== null &&
    "toString" in reason &&
    typeof reason.toString === "function"
  ) {
    // Use the object's toString method if available
    message = reason.toString();
  } else if (typeof reason === "object" && reason !== null) {
    // Perform a shallow iteration over the object's properties
    const entries = Object.entries(reason);
    if (entries.length > 0) {
      message = entries.map(([key, value]) => `${key}: ${value}`).join(", ");
    } else {
      message = `${reason}`;
    }
  } else {
    // Fallback for other types like undefined or symbols
    message = `${reason}`;
  }

  return message;
}
