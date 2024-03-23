import { RPCClient } from "./client.ts";

export interface RPCCallback {
    (sub: string, arg?: Uint8Array): void;
}

export class RPCMod {
    private constructor(readonly id: string, readonly client: RPCClient) {
    }

    public _dispatch(_sub: string, _content?: Uint8Array) {
    }

    public _subscribe = false;

    private readonly subscriptions = new Set<RPCCallback>();
    public subscribe(cb: RPCCallback) {
        this.subscriptions.add(cb);
        this._subscribe = true;
        this.client._active_session.value?.push_mod_subscribe(this.id);
        return this;
    }

    public static get(client: RPCClient, id: string): RPCMod {
        if (client._mods.has(id)) {
            return client._mods.get(id)!;
        } else {
            const mod = new RPCMod(id, client);
            client._mods.set(id, mod);
            return mod;
        }
    }
}
