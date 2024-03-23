import { Call, SchemaI, SchemaO, SignalO } from "../schema.ts";
import { RPCMod } from "./call.ts";
import { AGGREGATION_TIMEOUT, RPCServer } from "./server.ts";
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
            c: this.calls.length ? this.calls : undefined,
            s: this.signals.size ? this.signals : undefined,
        });
        this.calls.length = 0;
        this.signals.clear();
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
