# child-process-utilities

## Installation

```
yarn add child-process-utilities
```

## Usage

### Wait for a process to finish

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  await spawn("npx", ["ts-node", "src"]).wait();
}
```

### Get the output of a process

#### [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  const { stdout, stderr } = await spawn("npx", ["ts-node", "src"]).output();
  console.log(await stdout().decode('UTF-8')); // Returns a string
  console.error(await stderr().decode('UTF-8')); // Returns a string
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
