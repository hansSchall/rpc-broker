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

import type { RPCConnection } from "./conn.ts";
import type { RPCMod } from "./call.ts";
import type { RPCSignal } from "./signal.ts";
import { attach_direct } from "../helper/attach_direct.ts";
import { RPCClient } from "../client/client.ts";

export * from "./call.ts";
export * from "./conn.ts";
export * from "./signal.ts";

/**
 * RPC Server
 */
export class RPCServer {
    constructor(readonly aggregate: number = 1) {
        attach_direct(this, this.client);
    }
    /**
     * default client (automatically attached)
     */
    readonly client: RPCClient = new RPCClient();
    /**
     * @internal
     */
    readonly _clients: Set<RPCConnection> = new Set();
    /**
     * @internal
     */
    readonly _mods: Map<string, RPCMod> = new Map();
    /**
     * @internal
     */
    readonly _signals: Map<string, RPCSignal> = new Map();

    /**
     * cleanup
     */
    public dispose() {
        for (const $ of this._clients) {
            $.dispose();
        }
        this.client.dispose();
    }
}
