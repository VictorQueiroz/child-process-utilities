# child-process-utilities

Memory-efficient utilities to deal with `child_process` native Node.js package.

## Installation

```
npm i child-process-utilities
```

## Usage

**Please note that for performance reasons any decisive output functions can only be called once.**

```ts
const childProcess = spawn(/* ... */, /* ... */, /* ... */);

childProcess.output().stderr().raw() // Do
childProcess.output().stderr().raw() // Don't
//             stderr ^^^^^^

// stdout
childProcess.output().stdout().raw() // Do
childProcess.output().stdout().raw() // Don't
//             stdout ^^^^^^
```

### Wait for a process to finish

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  await spawn("npx", ["ts-node", "src"]).wait();
}
```

### Wait for a process to finish without consuming stdout

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  await spawn.pipe("npx", ["ts-node", "src"]).wait();
}
```

### Get the output of a process

#### [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  const { stdout, stderr } = await spawn("npx", ["ts-node", "src"]).output();
  console.log(await stdout().decode("UTF-8")); // Returns a string
  console.error(await stderr().decode("UTF-8")); // Returns a string
}
```

#### [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  const { stdout, stderr } = await spawn("npx", ["ts-node", "src"]).output();
  console.log(await stdout().raw()); // Returns an Uint8Array
  console.error(await stderr().raw()); // Returns an Uint8Array
}
```

#### [JSON](https://www.json.org/json-en.html)

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  const { stdout, stderr } = await spawn("npx", ["ts-node", "src"]).output();
  console.log(await stdout().json()); // Parses the stdout as JSON
  console.error(await stderr().json()); // Parses the stderr as JSON
}
```

##### JSON property type inference

You can pass a type to the `spawn` function to infer the return type of the `output` method. Currently, we only support defining a type for the `json` `output` property.

```ts
// (method) IReadableHelper<{ json: number; }>.json<number>(): Promise<number>
spawn</* Using TypeScript inline types */ { json: number }>("x")
  .output()
  .stdout()
  .json(); // Promise<number>

interface IVideoMetadata {
  duration: number;
  fileName: string;
}

interface IGetVideoMetadataTypes {
  json: IVideoMetadata;
}

// (method) IReadableHelper<IVideoMetadata>.json<IVideoMetadata>(): Promise<IVideoMetadata>
spawn<IGetVideoMetadataTypes>("/home/user/get-video-metadata.sh", [
  "video.mp4" /* ... */,
])
  .output()
  .stdout()
  .json(); // Promise<IVideoMetadata>

// (method) IReadableHelper<{ json: unknown; }>.json<unknown>(): Promise<unknown>
spawn("x").output().stdout().json(); // Promise<unknown>
```

Advantages on this approach is that you can define a spawn method that returns a predefined type:

```ts
import { spawn } from "child-process-utilities";

export interface IVideoMetadata {
  duration: number;
  fileName: string;
}

export interface IGetVideoMetadataTypes {
  json: IVideoMetadata;
}

const getVideoMetadata = (url: string) =>
  spawn<IGetVideoMetadataTypes>("/home/user/get-video-metadata.sh", [url]);

export default getVideoMetadata;
```

```ts
import getVideoMetadata from "./getVideoMetadata";

export default async function askForVideoMetadata() {
  const pendingVideoMetadata = getVideoMetadata("video.mp4");
  const error = await pendingVideoMetadata.output().stderr().raw();

  try {
    const videoMetadata = await pendingVideoMetadata.output().stdout().json();
  } catch (error) {
    process.stderr.write(error);
  }
}
```
