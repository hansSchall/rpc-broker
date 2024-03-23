import { assertEquals } from "https://deno.land/std@0.214.0/assert/mod.ts";
import { decode, encode } from "./object_stream.ts";

Deno.test("encode/decode", () => {
    function test(inp: unknown) {
        assertEquals(decode(encode(inp)), inp);
    }
    test(5);
    test("foo");
    test({
        foo: 5,
    });
    test(new Map([["foo", 5]]));
});
