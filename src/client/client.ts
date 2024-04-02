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

import type { RPCMod } from "./call.ts";
import type { RPCSession } from "./session.ts";
import type { RPCSignal } from "./signal.ts";
import { computed, type Signal, signal } from "../deps.ts";
import { ClientAPI } from "./client_api.ts";
import type { ReadonlySignal } from "../deps.ts";

export * from "./call.ts";
export * from "./session.ts";
export * from "./signal.ts";
export * from "./client_api.ts";

/**
 * handles one RPC client
 * Usually one instance per instance
 */
export class RPCClient extends ClientAPI {
    constructor(readonly aggregate = 1) {
        super();
        this.client = this;
    }
    readonly _mods: Map<string, RPCMod> = new Map();
    readonly _signals: Map<string, RPCSignal> = new Map();
    readonly _active_session: Signal<null | RPCSession> = signal(null);
    readonly connected: ReadonlySignal<boolean> = computed(() => this._active_session !== null);
    readonly client: RPCClient;

    /**
     * cleanup
     */
    public dispose() {
        this._active_session.peek()?.dispose();
    }
}

/**
 * Implements the same API as RPCClient
 * Used for client wrappers like WebSocketClient
 */
export abstract class RPCClientImpl extends ClientAPI {
    constructor(client: ClientAPI) {
        super();
        this.client = client.client;
    }
    readonly client: RPCClient;

    /**
     * cleanup
     */
    public dispose() {
        this.client.dispose();
    }
}
