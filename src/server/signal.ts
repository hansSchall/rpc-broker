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

import type { SignalI, SignalO } from "../schema.ts";
import type { RPCConnection } from "./conn.ts";
import type { RPCServer } from "./server.ts";
import { merge_signal } from "./merge_signal.ts";

/**
 * compares Uint8Arrays
 */
function u8a_eq(a: Uint8Array, b: Uint8Array) {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

/**
 * compares (Uint8Array | null)
 */
function update_eq(a: Uint8Array | null, b: Uint8Array | null) {
    if (a === b) {
        return true;
    } else if (a === null || b === null) {
        return false; // if both are null, a === b would have been true
    } else {
        return u8a_eq(a, b);
    }
}

/**
 * Server handle of RPC Signals
 * @internal
 */
export class RPCSignal {
    private constructor(readonly id: string) {
    }

    private subscriptions = new Set<RPCConnection>();
    public subscribe(conn: RPCConnection) {
        this.subscriptions.add(conn);
        this.send_value(conn);
    }
    public unsubscribe(conn: RPCConnection) {
        this.subscriptions.delete(conn);
    }

    private owner: null | RPCConnection = null;
    private current_value: Uint8Array | null = null;

    private update(value: Uint8Array | null) {
        if (!update_eq(value, this.current_value)) {
            this.current_value = value;
            for (const $ of this.subscriptions) {
                this.send_value($);
            }
        }
    }

    public handle({ v: value, d: drop, s: subscribe }: SignalI, src: RPCConnection) {
        if (subscribe === true) {
            this.subscribe(src);
        } else if (subscribe === false) {
            this.unsubscribe(src);
        }
        if (src === this.owner) {
            if (drop === true) {
                this.update(null);
            } else if (value) {
                this.update(value);
            }
        } else {
            if (this.owner === null) {
                if (value && !drop) {
                    this.owner = src;
                    this.update(value);
                    this.send_src({
                        h: true,
                    }, src);
                }
            }
        }
    }

    private send_value(to: RPCConnection) {
        if (this.current_value) {
            this.send_src({
                v: this.current_value,
            }, to);
        } else {
            this.send_src({
                d: true,
            }, to);
        }
    }

    private send_src(data: SignalO, src: RPCConnection) {
        src._push_signal(this.id, data, merge_signal);
    }

    public static get(server: RPCServer, id: string): RPCSignal {
        if (server._signals.has(id)) {
            return server._signals.get(id)!;
        } else {
            const sig = new RPCSignal(id);
            server._signals.set(id, sig);
            return sig;
        }
    }
    /**
     * @internal
     */
    public static _drop_conn(conn: RPCConnection) {
        for (const [, mod] of conn.server._signals) {
            mod.unsubscribe(conn);
            if (conn === mod.owner) {
                mod.update(null);
                mod.owner = null;
            }
        }
    }
}
