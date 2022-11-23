import type {Heap} from "./heap";
import {bufferMap, settingsMap} from "./maps";

export class Struct {
  static get size() {
    return 0;
  }

  get size() {
    return 0;
  }

  static from<T extends typeof Struct>(this: T, buffer: Buffer | Struct): InstanceType<T> {
    if (!(buffer instanceof Buffer)) buffer = bufferMap.get(buffer);
    const self = new this as InstanceType<T>;
    bufferMap.set(self, buffer);
    return self;
  }

  static bufferOf<T extends Struct>(struct: T) {
    return bufferMap.get(struct);
  }

  static new<T extends Struct>(this: (new(...a: any[]) => T), heap?: Heap) {
    heap ??= globalThis.GlobalHeap;
    const {size} = settingsMap.get(this.prototype)
    const buffer = heap.malloc(size);
    const instance = Reflect.construct(this.prototype.constructor, [], this)

    // enable constructor to use default values, copy tmp buffer created in constructor
    if (bufferMap.has(instance)) {
      const tmp = bufferMap.get(instance);
      const view = new Uint8Array(buffer);
      view.set(tmp, 0)
    }

    bufferMap.set(instance, buffer);
    return instance;
  }
}