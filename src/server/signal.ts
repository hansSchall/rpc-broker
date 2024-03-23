import { SignalI, SignalO } from "../schema.ts";
import { RPCConnection } from "./conn.ts";
import { RPCServer } from "./server.ts";
import { merge_signal } from "./merge_signal.ts";

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

function update_eq(a: Uint8Array | null, b: Uint8Array | null) {
    if (a === b) {
        return true;
    } else if (a === null || b === null) {
        return false; // if both are null, a === b would have been true
    } else {
        return u8a_eq(a, b);
    }
}

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
        src.push_signal(this.id, data, merge_signal);
    }

    public static get(server: RPCServer, id: string): RPCSignal {
        if (server.signals.has(id)) {
            return server.signals.get(id)!;
        } else {
            const sig = new RPCSignal(id);
            server.signals.set(id, sig);
            return sig;
        }
    }
    public static drop_conn(conn: RPCConnection) {
        for (const [, mod] of conn.server.signals) {
            mod.unsubscribe(conn);
            if (conn === mod.owner) {
                mod.update(null);
            }
        }
    }
}