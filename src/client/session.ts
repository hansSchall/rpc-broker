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

import { Mutable } from "../helper/mutable.ts";
import { Call, SchemaI, SchemaO, SignalO } from "../schema.ts";
import { RPCMod } from "./call.ts";
import { RPCClient } from "./client.ts";
import { RPCSignal } from "./signal.ts";

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
        client._active_session.value?.dispose();
        client._active_session.value = this;
    }
    readonly uid = crypto.randomUUID();
    public label: string = this.uid;

    private sender?: ReadableStreamDefaultController<SchemaO>;
    readonly readable = new ReadableStream<SchemaO>({
        start: (controller) => {
            this.sender = controller;
        },
        cancel: () => {
            this.dispose();
        },
    });
    readonly writable = new WritableStream<SchemaI>({
        write: (chunk) => {
            this.recv(chunk);
        },
    });
    private send(data: SchemaO) {
        if (this.sender) {
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
            m: this.mod_subscriptions,
            c: this.calls,
            s: this.signals,
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
    private mod_subscriptions = new Map<string, boolean>();
    public push_mod_subscribe(id: string) {
        this.mod_subscriptions.set(id, true);
        this.push();
    }
    public push_mod_unsubscribe(id: string) {
        this.mod_subscriptions.set(id, false);
        this.push();
    }
    private calls = Array<Call>();
    public push_call(call: Call) {
        this.calls.push(call);
        this.push();
    }

    private signals = new Map<string, SignalO>();
    public push_signal(id: string, signal: SignalO, merge: (a: SignalO, b: SignalO) => SignalO | null) {
        if (this.signals.has(id)) {
            const merged = merge(this.signals.get(id)!, signal);
            if (merged !== null) {
                this.signals.set(id, merged);
            } else {
                this.flush();
                this.signals.set(id, signal);
            }
        } else {
            this.signals.set(id, signal);
            this.push();
        }
    }

    private recv(data: SchemaI) {
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

    public disposed = false;
    dispose() {
        this.disposed = true;
        this.client._active_session.value = null;
        for (const [, signal] of this.client._signals) {
            signal._off();
        }
    }
}
