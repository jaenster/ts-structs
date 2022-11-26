import {WeakMapExt} from "map-ext";
import {Heap} from "./heap";

export type Block = [wkheap: WeakRef<Heap>, start: number, size: number]
export const blockMap = new WeakMapExt<Buffer, Block>(() => {
  return [undefined, NaN, NaN] as any;
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

export const getPointer = (obj: any) => {
  if (bufferMap.has(obj)) {
    const bm = blockMap.get(bufferMap.get(obj));
    return bm[1];
  }
}

export const getHeap = (obj: any) => {
  if (bufferMap.has(obj)) {
    const bm = blockMap.get(bufferMap.get(obj));
    return bm?.[0]?.deref();
  }
}