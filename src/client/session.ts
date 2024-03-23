import { Call, SchemaI, SchemaO, SignalO } from "../schema.ts";
import { RPCMod } from "./call.ts";
import { AGGREGATION_TIMEOUT, RPCClient } from "./client.ts";
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
            console.log();
        }
    }
    private flush() {
        if (this.timeout !== null) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.send({
            m: this.mod_subscriptions.size ? this.mod_subscriptions : undefined,
            c: this.calls.length ? this.calls : undefined,
            s: this.signals.size ? this.signals : undefined,
        });
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
            }, AGGREGATION_TIMEOUT);
        }
    }
    private mod_subscriptions = new Map<string, boolean>();
    public push_mod_subscribe(id: string) {
        this.mod_subscriptions.set(id, true);
    }
    public push_mod_unsubscribe(id: string) {
        this.mod_subscriptions.set(id, false);
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
        for (const [, signal] of this.client._signals) {
            signal._off();
        }
    }
}
