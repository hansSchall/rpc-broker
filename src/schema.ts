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

export type SchemaStatic = z.ZodObject<
    {
        l: z.ZodOptional<z.ZodString>;
        e: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        m: z.ZodOptional<z.ZodMap<z.ZodString, z.ZodBoolean>>;
        c: z.ZodOptional<
            z.ZodArray<
                z.ZodObject<
                    {
                        m: z.ZodString;
                        s: z.ZodString;
                        a: z.ZodOptional<z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>>;
                    },
                    "strip",
                    z.ZodTypeAny,
                    {
                        m: string;
                        s: string;
                        a?: Uint8Array;
                    },
                    {
                        m: string;
                        s: string;
                        a?: Uint8Array;
                    }
                >,
                "many"
            >
        >;
        s: z.ZodOptional<
            z.ZodMap<
                z.ZodString,
                z.ZodObject<
                    {
                        v: z.ZodOptional<z.ZodType<Uint8Array, z.ZodTypeDef, Uint8Array>>;
                        d: z.ZodDefault<z.ZodBoolean>;
                        s: z.ZodOptional<z.ZodBoolean>;
                        h: z.ZodOptional<z.ZodBoolean>;
                    },
                    "strip",
                    z.ZodTypeAny,
                    {
                        v?: Uint8Array;
                        d?: boolean;
                        s?: boolean;
                        h?: boolean;
                    },
                    {
                        v?: Uint8Array;
                        d?: boolean;
                        s?: boolean;
                        h?: boolean;
                    }
                >
            >
        >;
    },
    "strip",
    z.ZodTypeAny,
    {
        l?: string;
        e?: string[];
        m?: Map<string, boolean>;
        c?: {
            m: string;
            s: string;
            a?: Uint8Array;
        }[];
        s?: Map<string, {
            v?: Uint8Array;
            d?: boolean;
            s?: boolean;
            h?: boolean;
        }>;
    },
    {
        l?: string;
        e?: string[];
        m?: Map<string, boolean>;
        c?: {
            m: string;
            s: string;
            a?: Uint8Array;
        }[];
        s?: Map<string, {
            v?: Uint8Array;
            d?: boolean;
            s?: boolean;
            h?: boolean;
        }>;
    }
>;

export const Schema: SchemaStatic = z.object({
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
