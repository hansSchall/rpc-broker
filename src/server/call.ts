import { RPCConnection } from "./conn.ts";
import { RPCServer } from "./server.ts";

export class RPCMod {
    private constructor(readonly id: string) {
    }

    private subscriptions = new Set<RPCConnection>();
    public subscribe(conn: RPCConnection) {
        this.subscriptions.add(conn);
    }
    public unsubscribe(conn: RPCConnection) {
        this.subscriptions.delete(conn);
    }
    public dispatch(s: string, a?: Uint8Array) {
        for (const mod of this.subscriptions) {
            mod.push_call({
                m: this.id,
                s,
                a,
            });
        }
    }

    public static get(server: RPCServer, id: string): RPCMod {
        if (server.mods.has(id)) {
            return server.mods.get(id)!;
        } else {
            const mod = new RPCMod(id);
            server.mods.set(id, mod);
            return mod;
        }
    }
    public static unsubscribeAll(conn: RPCConnection) {
        for (const [, mod] of conn.server.mods) {
            mod.unsubscribe(conn);
        }
    }
}
