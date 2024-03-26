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
import { RPCServer } from "./server.ts";
import { RPCSignal } from "./signal.ts";

export class RPCConnection {
    constructor(readonly server: RPCServer) {
        server.clients.add(this);
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
            // console.log(`[Server] [RX]`, chunk);
            this.recv(chunk);
        },
    });
    private send(data: SchemaO) {
        if (this.sender) {
            // console.log(`[Server] [TX]`, data);
            this.sender.enqueue(data);
        } else {
            console.log(`[FailedToSend]`, data);
        }
    }
    private flush() {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        const data: Mutable<SchemaO> = {
            c: this.calls,
            s: this.signals,
        };
        if (this.calls.length === 0) {
            delete data.c;
        }
        if (this.signals.size === 0) {
            delete data.s;
        }
        this.send(data);
        this.calls.length = 0;
        this.signals.clear();
    }
    private timeout: null | number = null;
    private push() {
        if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.flush();
            }, this.server.aggregate);
        }
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
        if (data.m) {
            for (const [id, subscribe] of data.m) {
                const mod = RPCMod.get(this.server, id);
                if (subscribe) {
                    mod.subscribe(this);
                } else {
                    mod.unsubscribe(this);
                }
            }
        }
        if (data.c) {
            for (const { m, s, a } of data.c) {
                const mod = RPCMod.get(this.server, m);
                mod.dispatch(s, a);
            }
        }
        if (data.s) {
            for (const [id, $] of data.s) {
                const sig = RPCSignal.get(this.server, id);
                sig.handle($, this);
            }
        }
    }

    public disposed = false;
    dispose() {
        this.disposed = true;
        this.server.clients.delete(this);
        RPCMod.unsubscribeAll(this);
        RPCSignal.drop_conn(this);
    }
}
