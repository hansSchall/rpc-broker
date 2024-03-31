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

import { concat, Packr, Unpackr } from "../deps.ts";

const packr = new Packr();
const unpackr = new Unpackr();

/**
 * Serialize value
 */
export function encode<T = unknown>(value: T): Uint8Array {
    return packr.pack(value);
}

/**
 * Deserialize value
 */
export function decode(chunk: Uint8Array): unknown {
    return unpackr.unpack(chunk);
}

/**
 * TransformStream serializer
 */
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

/**
 * TransformStream Deserializer
 */
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
                    // deno-lint-ignore no-explicit-any
                } catch (err: any) {
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
