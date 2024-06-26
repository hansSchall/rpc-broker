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

import { EN_LOG } from "../deps.ts";
import type { Mutable } from "../helper/mutable.ts";
import type { Call, SchemaI, SchemaO, SignalO } from "../schema.ts";
import { RPCMod } from "./call.ts";
import type { RPCClient } from "./client.ts";
import { RPCSignal } from "./signal.ts";

/**
 * represents one connection session, e.g one WebSocket connection attempt
 */
export class RPCSession {
    constructor(readonly client: RPCClient) {
        for (const [id, mod] of client._mods) {
            if (mod._subscribe) {
                this.mod_subscriptions.set(id, true);
            }
        }
        for (const [, signal] of client._signals) {
            signal._reset();
        }
        client._active_session.peek()?.dispose();
        client._active_session.value = this;
    }
    readonly uid: string = crypto.randomUUID();
    public label: string = this.uid.substring(0, 6);

    private sender?: ReadableStreamDefaultController<SchemaO>;
    readonly readable: ReadableStream<SchemaO> = new ReadableStream({
        start: (controller) => {
            this.sender = controller;
        },
        cancel: () => {
            this.dispose();
        },
    });
    readonly writable: WritableStream<SchemaI> = new WritableStream({
        write: (chunk) => {
            if (EN_LOG) {
                console.log(`[Client ${this.label}] [RX]`, chunk);
            }
            this._recv(chunk);
        },
        close: () => {
            this.dispose();
        },
    });
    private send(data: SchemaO) {
        if (this.sender) {
            if (EN_LOG) {
                console.log(`[Client ${this.label}] [TX]`, data);
            }
            this.sender.enqueue(data);
        } else {
            console.error(`[FailedToSend]`, data);
        }
    }
    private flush() {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        const data: Mutable<SchemaO> = {
            m: new Map(this.mod_subscriptions),
            c: [...this.calls],
            s: new Map(this.signals),
        };
        if (this.mod_subscriptions.size === 0) {
            delete data.m;
        }
        if (this.calls.length === 0) {
            delete data.c;
        }
        if (this.signals.size === 0) {
            delete data.s;
        }
        this.send(data);
        this.calls.length = 0;
        this.signals.clear();
        this.mod_subscriptions.clear();
    }
    private timeout: null | number = null;
    private push() {
        if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.flush();
            }, this.client.aggregate);
        }
    }
    private mod_subscriptions: Map<string, boolean> = new Map();
    /**
     * @internal
     */
    public _push_mod_subscribe(id: string) {
        this.mod_subscriptions.set(id, true);
        this.push();
    }
    /**
     * @internal
     */
    public _push_mod_unsubscribe(id: string) {
        this.mod_subscriptions.set(id, false);
        this.push();
    }
    private calls: Call[] = [];
    /**
     * @internal
     */
    public _push_call(call: Call) {
        this.calls.push(call);
        this.push();
    }

    private signals: Map<string, SignalO> = new Map();
    /**
     * @internal
     */
    public _push_signal(id: string, signal: SignalO, merge: (a: SignalO, b: SignalO) => SignalO | null) {
        if (this.signals.has(id)) {
            const merged = merge(this.signals.get(id)!, signal);
            if (merged !== null) {
                this.signals.set(id, merged);
            } else {
                this.flush();
                this.signals.set(id, { ...signal });
            }
        } else {
            this.signals.set(id, { ...signal });
        }
        this.push();
    }

    private _recv(data: SchemaI) {
        if (data.l) {
            this.label = data.l ?? this.uid;
        }

        if (data.c) {
            for (const { m, s, a } of data.c) {
                const mod = RPCMod.get(this.client, m);
                mod._dispatch(s, a);
            }
        }
        if (data.s) {
            for (const [id, $] of data.s) {
                const sig = RPCSignal.get(this.client, id);
                sig._handle($);
            }
        }
    }

    /**
     * @readonly
     */
    public disposed: boolean = false;
    /**
     * dispose
     */
    dispose() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.disposed = true;
        this.client._active_session.value = null;
        try {
            this.sender?.close();
        } catch (_) {
            //
        }
        for (const [, signal] of this.client._signals) {
            signal._off();
        }
    }
}
