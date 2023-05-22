# child-process-utilities

## Installation

```
yarn add child-process-utilities
```

## Usage

```ts
import { spawn } from "child-process-utilities";

export default async function () {
  await spawn("npx", ["ts-node", "src"]).wait();
}
```
