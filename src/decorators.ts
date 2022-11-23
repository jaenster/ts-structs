import {Struct} from "./struct";
import {blockMap, bufferMap, settingsMap} from "./maps";

export function EmbeddedStruct<T extends object>(target: T, key: PropertyKey) {
  const type: new() => T = Reflect.getMetadata("design:type", target, key as string | symbol);
  const settings = settingsMap.get(target as any);
  const settingsOther = settingsMap.get(type.prototype);

  const offset = settings.size;
  settings.size += settingsOther.size;

  const instances = new WeakMap<T, object>();

  const getInstance = (obj: T): object => {
    if (instances.has(obj)) return instances.get(obj);

    const buffer = bufferMap.get(obj as Struct);
    const otherBuffer = buffer.slice(offset, offset + settingsOther.size);
    const set = Struct.from.call(type, otherBuffer);

    // set the blockmap
    const [ref, selfOffset] = blockMap.get(buffer)
    blockMap.set(otherBuffer, [ref, selfOffset+offset])
    instances.set(obj, set);
    return set;
  };

  Object.defineProperty(target, key, {
    get(this: T) {
      return getInstance(this);
    },
  });
}

function generateIntDecorator(bits: number, signed: boolean) {
  const bytes = bits >> 3;
  return function <T>(target: T, key: PropertyKey) {
    const settings = settingsMap.get(target as any);
    const offset = settings.size;

    settings.values.push([bytes, signed]);
    settings.size += bytes;

    Object.defineProperty(target, key, {
      get(this: Struct) {
        const buffer = bufferMap.get(this);
        return (signed ? buffer.readIntLE(offset, bytes) : buffer.readUIntLE(offset, bytes)) as number;
      },
      set(v: number) {

        const buffer = bufferMap.get(this);
        if (!signed) {
          const max = ((2 ** bits));
          v &= (max - 1);
          buffer.writeUIntLE(v, offset, bytes)
        } else {
          const max = ((2 ** (bits - 1)));
          if (v < -max) v = (max - 1) + (v % max);
          if (v > max - 1) v = -max + (v % max);
          buffer.writeIntLE(v, offset, bytes);
        }
      }
    });
  }
}

export function CString(bytes: number, encoding: BufferEncoding = 'utf8') {
  function decorator <T>(target: T, key: PropertyKey) {
    const settings = settingsMap.get(target as any as Struct);
    const offset = settings.size;

    settings.values.push([bytes, false]);
    settings.size += bytes;

    Object.defineProperty(target, key, {
      get() {
        const buffer = bufferMap.get(this);
        const str = buffer.toString(encoding, offset, bytes);
        if (str.includes('\0')) return str.substring(0, str.indexOf('\0'));
        return str;
      },
      set(v: string) {
        const tmpBuff = Buffer.from(v, encoding);
        const maxSize = Math.min(tmpBuff.length, bytes);
        const buffer = bufferMap.get(this);
        tmpBuff.copy(buffer, offset, 0, maxSize)
      }
    })
  }
  return decorator;
}


export const UInt8 = generateIntDecorator(8, false);
export const Int8 = generateIntDecorator(8, true);
export const UInt16 = generateIntDecorator(16, false);
export const Int16 = generateIntDecorator(16, true);
export const UInt32 = generateIntDecorator(32, false);
export const Int32 = generateIntDecorator(32, true);