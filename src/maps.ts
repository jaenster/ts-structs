import {WeakMapExt} from "map-ext";
import {Heap} from "./heap";

export const blockMap = new WeakMapExt<Buffer, [WeakRef<Heap>, number]>(() => {
  return [undefined, NaN] as any;
})

type Settings = {
  values: [bytes: number, signed: boolean][],
  size: number,
}

export const bufferMap = new WeakMapExt<object, Buffer>((source) => {
  const {size} = settingsMap.get(Object.getPrototypeOf(source));
  const heap = globalThis['GlobalHeap'];
  const block = heap.malloc(size);

  return block;
});

export const settingsMap = new WeakMapExt<object, Settings>(() => ({values: [], size: 0}));
