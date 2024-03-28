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

import { type RPCClient, RPCClientImpl } from "../client/client.ts";
import { RPCSession } from "../client/session.ts";
import { attach_websocket } from "./attach_websocket.ts";

export class WebsocketClient extends RPCClientImpl {
    constructor(client: RPCClient, readonly url: URL | string) {
        super(client);
        this.connect();
    }

    private connect() {
        const socket = new WebSocket(this.url);
        socket.addEventListener("open", () => {
            attach_websocket(new RPCSession(this.client), socket);
        });
        socket.addEventListener("close", () => {
            this.connect();
        });
    }
}
