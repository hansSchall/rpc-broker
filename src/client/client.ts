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

import { RPCCallback, RPCMod } from "./call.ts";
import { RPCSession } from "./session.ts";
import { RPCSignal } from "./signal.ts";
import { computed, signal } from "../deps.ts";
import { ClientHooks } from "./client_hooks.ts";

export interface RPCClientWrapper {
    readonly client: RPCClient;
}

export class RPCClient extends ClientHooks implements RPCClientWrapper {
    constructor(readonly aggregate = 1) {
        super();
    }
    readonly _mods = new Map<string, RPCMod>();
    readonly _signals = new Map<string, RPCSignal>();
    readonly _active_session = signal<null | RPCSession>(null);
    readonly connected = computed(() => this._active_session !== null);
    override readonly client: RPCClient = this;

    public signal(id: string) {
        return RPCSignal.get(this.client, id);
    }

    public mod(id: string) {
        return RPCMod.get(this.client, id);
    }

    public subscribe(id: string, cb: RPCCallback) {
        return RPCMod.get(this.client, id).subscribe(cb);
    }

    public call(id: string, sub: string, arg?: unknown) {
        return RPCMod.get(this.client, id).call(sub, arg);
    }
}

export abstract class RPCClientImpl extends ClientHooks implements RPCClientWrapper {
    constructor(client: RPCClientWrapper) {
        super();
        this.client = client.client;
    }
    override readonly client: RPCClient;
}
