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

export { z } from "npm:zod@3.22.4";
export * from "npm:@preact/signals@1.2.3";
export { effect } from "npm:@preact/signals@1.2.3";
export * from "npm:preact@10.20.1/hooks";
export { Packr, Unpackr } from "npm:msgpackr@1.10.1";

//export { concat } from "https://deno.land/std@0.184.0/bytes/concat.ts";
/**
 * @license MIT
 * Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
 */
export function concat(...buf: Uint8Array[]): Uint8Array {
    let length = 0;
    for (const b of buf) {
        length += b.length;
    }

    const output = new Uint8Array(length);
    let index = 0;
    for (const b of buf) {
        output.set(b, index);
        index += b.length;
    }

    return output;
}

/**
 * debug config: enable logging of all traffic
 */
export const EN_LOG = false;
