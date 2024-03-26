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
        // console.log(`[Server] [Dispatch] ${s}, subs=${this.subscriptions.size}`);
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
