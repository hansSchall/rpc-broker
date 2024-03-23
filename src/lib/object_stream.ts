import { Packr, Unpackr } from "https://deno.land/x/msgpackr@v1.10.1/index.js";
import { concat } from "https://deno.land/std@0.184.0/bytes/concat.ts";

const packr = new Packr();
const unpackr = new Unpackr();

export function encode<T = unknown>(value: T): Uint8Array {
    return packr.pack(value);
}

export function decode(chunk: ArrayLike<number>): unknown {
    return unpackr.unpack(chunk);
}

export class PackrStream<T = unknown> extends TransformStream<T, Uint8Array> {
    private packr = new Packr();
    constructor() {
        super({
            transform: (chunk, controller) => {
                controller.enqueue(this.packr.pack(chunk));
            },
        });
    }
}

export class UnpackrStream extends TransformStream<Uint8Array, unknown> {
    private incompleteBuffer?: Uint8Array;
    private unpackr = new Unpackr();

    constructor() {
        super({
            transform: (chunk, controller) => {
                if (this.incompleteBuffer) {
                    chunk = concat(this.incompleteBuffer, chunk);
                    this.incompleteBuffer = undefined;
                }
                let values: unknown[] = [];
                try {
                    values = this.unpackr.unpackMultiple(chunk)!;
                } catch (err) {
                    if (err.incomplete) {
                        this.incompleteBuffer = chunk.slice(err.lastPosition);
                        values = err.values ?? [];
                    } else {
                        throw err;
                    }
                } finally {
                    for (const value of values) {
                        controller.enqueue(value);
                    }
                }
            },
        });
    }
}
