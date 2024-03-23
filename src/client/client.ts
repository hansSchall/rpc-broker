import { RPCCallback, RPCMod } from "./call.ts";
import { RPCSession } from "./session.ts";
import { RPCSignal } from "./signal.ts";
import { computed, signal } from "@preact/signals";

export const AGGREGATION_TIMEOUT = 2;

export class RPCClient {
    constructor() {
    }
    readonly _mods = new Map<string, RPCMod>();
    readonly _signals = new Map<string, RPCSignal>();
    readonly _active_session = signal<null | RPCSession>(null);
    readonly connected = computed(() => this._active_session !== null);

    public signal(id: string) {
        return RPCSignal.get(this, id);
    }

    public mod(id: string) {
        return RPCMod.get(this, id);
    }

    public subscribe(id: string, cb: RPCCallback) {
        return RPCMod.get(this, id).subscribe(cb);
    }
}
