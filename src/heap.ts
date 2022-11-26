import {EmbeddedStruct} from "./decorators";
import {Lock} from "./buildin/lock";
import {blockMap, bufferMap, settingsMap} from "./maps";

enum Flags {
  TAKEN = 1 << 0,
}

function isSet(field: number, binary: number) {
  return (field & binary) === binary;
}

function notSet(field: number, binary: number) {
  return (field & binary) === 0;
}


export class Heap {
  private readonly heap: SharedArrayBuffer;
  private readonly flags: SharedArrayBuffer;

  get selfSize() {
    return settingsMap.get(Object.getPrototypeOf(this)).size;
  }

  constructor() {
    this.heap = new SharedArrayBuffer(1024 * 64)
    this.flags = new SharedArrayBuffer(1024 * 64 / 8)

    // Implicit malloc own size
    const buffer = Buffer.from(this.heap, 0, this.selfSize);

    const {size} = settingsMap.get(Object.getPrototypeOf(this));
    bufferMap.set(this, buffer)
    blockMap.set(buffer, [new WeakRef(this), 0, size])
    this.markTaken(0, size);

    Atomics.store(buffer, 0, 1);
  }

  @EmbeddedStruct
  private lock: Lock

  protected isFree(from: number, size: number) {
    const view = new Uint8Array(this.flags)
    for (let i = 0; i < size; i++) {
      if (isSet(view[from + i], Flags.TAKEN)) {
        return false;
      }
    }
    return true;
  }

  protected markTaken(from: number, size: number) {
    const view = new Uint8Array(this.flags)
    for (let i = 0; i < size; i++) {
      view[from + i] |= Flags.TAKEN;
    }
  }

  protected markFree(from: number, size: number) {
    const view = new Uint8Array(this.flags)
    for (let i = 0; i < size; i++) {
      view[from + i] &= (0xFF ^ Flags.TAKEN);
    }
  }

  malloc(size: number): Buffer {
    const {lock} = this;
    lock.lock()
    try {
      for (let i = 0; i < this.flags.byteLength; i++) {
        if (this.isFree(i, Math.min(size / 8, 1))) {
          // found space
          this.markTaken(i, size);
          return this.getSlice(i, size);
        }
      }
      throw Error('Insufficient space');
    } finally {
      lock.unlock()
    }
  }

  getSlice(from: number, to: number) {
    const buffer = Buffer.from(this.heap, from, to)

    // store data
    const blockData = blockMap.get(buffer);
    blockData[0] = new WeakRef(heap);
    blockData[1] = from;
    blockData[2] = to;

    return buffer;
  }

  free(obj: object) {
    const {lock} = this;
    lock.lock();
    try {
      if (!bufferMap.has(obj)) {
        return; // Not part of this heap, so nothing to free
      }

      const buffer = bufferMap.get(obj);
      const [heap, offset, size] = blockMap.get(buffer)
      if (heap?.deref() !== this) {
        return; // Not part of this heap
      }

      this.markFree(offset, size);
    } finally {
      lock.unlock();
    }

  }
}


let heap: Heap;
Object.defineProperty(globalThis, 'GlobalHeap', {
  get() {
    return heap ??= new Heap();
  },
  set(v: Heap) {
    heap = v;
  }
});
