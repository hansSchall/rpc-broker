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

import { encode } from "../lib/object_stream.ts";
import { RPCHub } from "./hub.ts";
import { RPCHubClient } from "./hubclient.ts";

export class RPCHubMod {
    private constructor(readonly hub: RPCHub, readonly id: string) {
        hub.client.subscribe(id, (s, a) => {
            this.dispatch(s, encode(a));
        });
    }

    private subscriptions = new Set<RPCHubClient>();
    public subscribe(conn: RPCHubClient) {
        this.subscriptions.add(conn);
    }
    public unsubscribe(conn: RPCHubClient) {
        this.subscriptions.delete(conn);
    }
    public dispatch(s: string, a?: Uint8Array) {
        // console.log(`[Hub] [Dispatch] ${s}, subs=${this.subscriptions.size}`);
        for (const mod of this.subscriptions) {
            mod.push_call({
                m: this.id,
                s,
                a,
            });
        }
    }

    public static get(hub: RPCHub, id: string): RPCHubMod {
        if (hub._hub_mods.has(id)) {
            return hub._hub_mods.get(id)!;
        } else {
            const mod = new RPCHubMod(hub, id);
            hub._hub_mods.set(id, mod);
            return mod;
        }
    }
    public static unsubscribeAll(conn: RPCHubClient) {
        for (const [, mod] of conn.hub._hub_mods) {
            mod.unsubscribe(conn);
        }
    }
}
