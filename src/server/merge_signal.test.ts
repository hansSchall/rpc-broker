import { assertEquals, AssertionError, assertObjectMatch } from "https://deno.land/std@0.214.0/assert/mod.ts";
import { merge_signal } from "./merge_signal.ts";

Deno.test("merge_signal.hold", () => {
    function assertHold(a: boolean | undefined, b: boolean | undefined, exp: boolean | undefined | null) {
        const merged = merge_signal({ h: a }, { h: b });
        if (exp === null) {
            assertEquals(merged, null);
        } else {
            if (merged === null) {
                throw new AssertionError(`merge unexpectedly failed`);
            }
            assertObjectMatch(merged, { h: exp, v: undefined, d: undefined });
        }
    }

    assertHold(undefined, undefined, undefined);
    assertHold(true, undefined, true);
    assertHold(false, undefined, false);
    assertHold(undefined, true, true);
    assertHold(undefined, false, false);
    assertHold(true, true, true);
    assertHold(true, false, null);
    assertHold(false, true, null);
    assertHold(false, false, false);
});

Deno.test("merge_signal.update", () => {
    // TODO
});
