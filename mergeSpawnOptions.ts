import createSpawnWithDefaultOptions, {
  IOptions,
  ISpawn
} from "./createSpawnWithDefaultOptions";

export default function mergeOptions(dst: ISpawn, src: ISpawn): ISpawn {
  const mergedDefaultOptions: IOptions = {
    ...dst.defaultOptions,
    ...src.defaultOptions
  };

  const spawnWithMergedDefaultOptions =
    createSpawnWithDefaultOptions(mergedDefaultOptions);

  function mergedSpawn(command: string, args: string[] = [], options = {}) {
    return spawnWithMergedDefaultOptions(command, args, options);
  }

  mergedSpawn.defaultOptions = mergedDefaultOptions;

  return mergedSpawn;
}
