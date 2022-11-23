import {Struct} from "../src";
import {CString, EmbeddedStruct, Int8, UInt16, UInt32, UInt8} from "../src";

describe('binary class', () => {

    it('binary class', () => {

        class Foo extends Struct {
            @UInt8
            a: number;
        }

        const foo = new Foo();
        foo.a = 5;
        expect(foo.a).toEqual(5);
    })

    it('overflow', () => {

        class Foo extends Struct {
            @UInt8
            overflow: number;
        }

        const foo = new Foo();
        foo.overflow = (2 ** 8) + 5;
        expect(foo.overflow).toEqual(5);
    });

    it('signed overflow', () => {

        class Foo extends Struct {
            @Int8
            overflow: number;
        }

        const foo = new Foo();
        foo.overflow = -72;
        expect(foo.overflow).toEqual(-72);

        foo.overflow = 123;
        expect(foo.overflow).toEqual(123);

        foo.overflow = -129;
        expect(foo.overflow).toEqual(126);

        foo.overflow = 128;
        expect(foo.overflow).toEqual(-128);
    });

    it('overlaps', () => {
        class Foo extends Struct {
            @UInt8
            a: number = 5;

            @UInt8
            b: number = 8;
        }

        class Bar extends Struct {
            @UInt16
            a: number;
        }

        const foo = Foo.new();
        const bar = Bar.from(foo);

        foo.a = 3;
        foo.b = 1;

        expect(foo.a).toEqual(3);
        expect(foo.b).toEqual(1);

        // Since foo.a = 3, and foo.b = 1, the 8th bit is set and the first 2
        expect(bar.a).toEqual(1 << 8 | 3)

        // set the 9th bit on
        bar.a = 1 << 9

        // As bar.a modifies the first 16 bits of foo, these change too
        expect(foo.b).toEqual(2);
        expect(foo.a).toEqual(0);
    })

    it('CString empty is empty string', () => {

        class Foo {
            @CString(50)
            a: string
        }

        const foo = new Foo;
        expect(foo.a).toBe('');
    })

    it('CString can contain values', () => {

        class Foo {
            @CString(50)
            a: string
        }

        const foo = new Foo;
        foo.a = 'hello world';
        expect(foo.a).toBe('hello world');
    })

    it('CString can have overlap', () => {

        class Foo extends Struct {
            @CString(50)
            a: string
        }

        class Bar extends Struct {
            @CString(10)
            a: string

            @CString(25)
            b: string

        }

        const foo = new Foo;
        const bar = Bar.from(foo)

        foo.a = '0123456789Hello world';

        expect(bar.a).toBe('0123456789');
        expect(bar.b).toBe('Hello world');
    });

    it('Contained structure', () => {
        let instance: Bar;

        class Bar {
            @UInt16
            a: number;
            @UInt32
            b: number;
            @UInt8
            c: number;
            @UInt8
            d: number;

            @CString(50)
            e: string

            constructor() {
                instance = this;
            }
        }

        class Foo {
            @EmbeddedStruct
            test: Bar
        }

        class Baz {
            @UInt32
            a: number
            @UInt32
            b: number

            @CString(50)
            s: string
        }

        const foo = new Foo;
        foo.test.b = 5;


        // unsafe
        const baz = Struct.from.call(Baz, foo);

        baz.s = 'test1234';
        expect(instance.e).toBe('test1234')
        expect(instance).toBeDefined();
        expect(instance.b).toBe(5);
    })
})


class Foo extends Struct {
    @UInt8
    a: number;
}

const foo = new Foo;
foo.a = 5;

// <Buffer 05>
console.log(Struct.bufferOf(foo));