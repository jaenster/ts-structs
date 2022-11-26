import {Struct} from "..";
import {Pointer} from "../decorators";
import {getHeap, getPointer} from "../maps";

export class List<T extends Struct> extends Struct {
  @Pointer
  next: List<T>

  @Pointer
  current: T

  add(v: T) {
    const {current, next} = this;
    if (current === null) {
      console.log('here');
      this.current = v;
    } else if (next === null) {
      console.log('create next')
      const list = new List<T>(getHeap(this))
      list.current = v
      this.next = list;
      console.log('new pointer', getPointer(this.next))
    } else {
      console.log('recursive add')
      next.add(v);
    }
    return this;
  }

  forEach(cb: (v: T, node: List<T>) => any) {
    for(const [current, node] of this) {
      current && void cb(current, node);
    }
  }

  * [Symbol.iterator](): Generator<[T, List<T>]> {
    const {current, next} = this;
    if (current) yield [current, this];
    if (next) yield *next
  }

  remove(v: T) {
    let last: List<T>
    const ptr = getPointer(v)
    for (const [current, self] of this) {
      const {next} = self;
      if (current && getPointer(current) === ptr) {
        if (last && next) { // remove this node
          last.next = next;
        } else if (next) { // First node, but a next
          self.current = next.current;
          self.next = next.next;
        } else if (last) {
          last.next = null
        } else {
          self.current = null;
        }
        return;
      }
      last = self;
    }
  }
}

