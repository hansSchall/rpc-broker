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

import { RPCClient } from "../mod.ts";
import type { RPCHubMod } from "./hubMod.ts";
import type { RPCHubSignal } from "./hubSignal.ts";
import type { RPCHubClient } from "./hubClient.ts";

export * from "./hubMod.ts";
export * from "./hubSignal.ts";
export * from "./hubClient.ts";

/**
 * Share the connection of a RPCClient with other clients
 */
export class RPCHub extends RPCClient {
    /**
     * @internal
     */
    readonly _clients: Set<RPCHubClient> = new Set();
    /**
     * @internal
     */
    readonly _hub_mods: Map<string, RPCHubMod> = new Map();
    /**
     * @internal
     */
    readonly _hub_signals: Map<string, RPCHubSignal> = new Map();

    /**
     * cleanup
     */
    public dispose() {
        super.dispose();
        for (const $ of this._clients) {
            $.dispose();
        }
    }
}
