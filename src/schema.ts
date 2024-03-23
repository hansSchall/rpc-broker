import { z } from "zod";

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
