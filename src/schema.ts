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

import { z } from "./deps.ts";

export const Schema = z.object({
    l: z.string(), // label
    e: z.string().array(), // error
    m: z.map(z.string(), z.boolean()), // mod
    c: z.object({ // call
        m: z.string(), // mod
        s: z.string(), // sub
        a: z.instanceof(Uint8Array).optional(), // arg
    }).array(),
    s: z.map(
        z.string(),
        z.object({ // signal
            v: z.instanceof(Uint8Array).optional(), // value
            d: z.boolean().default(false), // drop
            s: z.boolean().optional(), // subscribe
            h: z.boolean().optional(), // hold
        }),
    ),
}).partial();

export type SchemaI = Readonly<z.output<typeof Schema>>;
export type SchemaO = Readonly<z.input<typeof Schema>>;

type MapItem<M> = M extends Map<unknown, infer T> ? T : never;
type ArrayItem<A> = A extends Array<infer T> ? T : never;

export type Call = ArrayItem<SchemaI["c"]>;
export type SignalI = MapItem<SchemaI["s"]>;
export type SignalO = MapItem<SchemaO["s"]>;
