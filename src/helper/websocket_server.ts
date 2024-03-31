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

import { RPCConnection } from "../server/conn.ts";
import { RPCServer } from "../server/server.ts";
import { attach_websocket } from "./attach_websocket.ts";

/**
 * builtin WebSocket server core for integrating into your own server (Deno only)
 */
export function upgrade_websocket(server: RPCServer, req: Request) {
    const { socket, response } = Deno.upgradeWebSocket(req);
    attach_websocket(new RPCConnection(server), socket);
    return response;
}

/**
 * builtin WebSocket server (Deno only)
 */
export function serve_websocket(port: number) {
    const rpc = new RPCServer();
    const http = Deno.serve({
        port,
    }, (request) => {
        return upgrade_websocket(rpc, request);
    });
    return {
        rpc,
        http,
    };
}
