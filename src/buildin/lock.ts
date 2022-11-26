import {UInt32} from "../decorators";
import {Struct} from "../struct";
import {blockMap, bufferMap} from "../maps";

export class Lock {
  @UInt32
  mutex: number;

  private cached_view: Int32Array;

  private get view() {
    return this.cached_view ??= new Int32Array(Struct.bufferOf(this as any).buffer);
  }

  lock() {
    const buffer = bufferMap.get(this);
    const [, offset] = blockMap.get(buffer)

    while (true) {
      if (Atomics.compareExchange(this.view, offset, 0, 1) === 1) {
        break;
      }
      Atomics.wait(this.view, offset, 0);
    }
  }

  unlock() {
    const {view} = this;

    // Store value and notify
    Atomics.store(view, 0, 0);
    Atomics.notify(view, 0, 1);
  }
}