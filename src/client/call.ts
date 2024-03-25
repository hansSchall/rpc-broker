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

import { decode, encode } from "../lib/object_stream.ts";
import { RPCClient } from "./client.ts";

export interface RPCCallback {
    (sub: string, arg: unknown): void;
}

export class RPCMod {
    private constructor(readonly id: string, readonly client: RPCClient) {
    }

    public _dispatch(sub: string, content?: Uint8Array) {
        const arg = content ? decode(content) : undefined;
        for (const $ of this.subscriptions) {
            $(sub, arg);
        }
    }

    public _subscribe = false;

    private readonly subscriptions = new Set<RPCCallback>();
    public subscribe(cb: RPCCallback) {
        this.subscriptions.add(cb);
        this._subscribe = true;
        this.client._active_session.value?.push_mod_subscribe(this.id);
        return this;
    }

    public call(sub: string, arg?: unknown) {
        // console.log("active session", this.client._active_session.value);
        if (arg !== undefined) {
            this.client._active_session.value?.push_call({
                m: this.id,
                s: sub,
                a: encode(arg)
            });
        } else {
            this.client._active_session.value?.push_call({
                m: this.id,
                s: sub,
            });
        }
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
