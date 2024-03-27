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
import { RPCMod } from "./call.ts";
import { RPCSignal } from "./signal.ts";
import { attach_direct } from "../helper/attach_direct.ts";
import { RPCClient } from "../client/client.ts";

export * from "./call.ts";
export * from "./conn.ts";
export * from "./signal.ts";

export class RPCServer {
    constructor(readonly aggregate = 1) {
        attach_direct(this, this.client);
    }
    readonly client = new RPCClient();
    readonly clients = new Set<RPCConnection>();
    readonly mods = new Map<string, RPCMod>();
    readonly signals = new Map<string, RPCSignal>();
}
