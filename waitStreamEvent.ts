import { Readable, Writable } from "stream";
import Exception from "./Exception";

// export default function waitStreamEvent(stream: Writable | Readable | null, event: 'end') {
//   if (stream === null) {
//     return Promise.resolve();
//   }
//   return new Promise<void>((resolve, reject) => {
//     if('writable' in stream) {
//       switch(event) {
//         case 'end':
//           stream.on('finish', () => {
//             resolve();
//           })
//           break;
//       }
//     }
//
//     if('readable' in stream) {
//       switch(event) {
//         case 'end':
//           stream.on('end', () => {
//             resolve();
//           })
//           break;
//       }
//     }
//
//     // Listen for the `error` event
//     stream.on("error", (error) => {
//       reject(error);
//     });
//   });
// }
//

export default function waitStreamEvent(
  stream: Writable | Readable | null,
  event: "end"
) {
  if (stream === null) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    if ("writable" in stream) {
      if (event === "end" && stream.writableEnded) {
        resolve();
        return;
      }
      stream.on("finish", () => resolve());
    }

    if ("readable" in stream) {
      if (event === "end" && stream.readableEnded) {
        resolve();
        return;
      }
      stream.on("end", () => resolve());
    }

    stream.on("error", (error) => reject(error));
  });
}
