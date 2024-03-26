/**
 * @license GPL-3.0-or-later
 * RPC-Broker
 *
 * Copyright (C) 2024 Hans Schallmoser
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
