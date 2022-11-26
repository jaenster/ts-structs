# Struct-model

To interact with low level data, it's annoying to work with buffers. It would be way more nice to write models with
decorators

```typescript
import {Struct, UInt8} from 'stuct-model'

class Foo extends Struct {
    @UInt8
    a: number;
}

const foo = new Foo();

foo.a = 5;
console.log(Struct.bufferOf(foo)); // <Buffer 05>

// An UInt8
foo.a = 300;
console.log(foo.a); // 44 because 300 - 256 = 44. It overflows
console.log(Struct.bufferOf(foo)); // <Buffer 2c>
```

ToDo; Write proper readme file, checkout the test [source code](https://github.com/jaenster/ts-structs/blob/master/test/binary-class.spec.ts)