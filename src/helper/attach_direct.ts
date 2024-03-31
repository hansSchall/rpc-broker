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

import type { RPCClient } from "../client/client.ts";
import { RPCSession } from "../client/session.ts";
import type { RPCHub } from "../hub/hub.ts";
import { RPCHubClient } from "../hub/hubClient.ts";
import { ZodStream } from "../lib/zod_stream.ts";
import { Schema } from "../schema.ts";
import { RPCConnection } from "../server/conn.ts";
import type { RPCServer } from "../server/server.ts";

/**
 * directly connect a client to a server without any intermediary serialization
 */
export function attach_direct(server: RPCServer, client: RPCClient): {
    conn: RPCConnection;
    session: RPCSession;
} {
    const conn = new RPCConnection(server);
    const session = new RPCSession(client);
    // zod needed for default values
    conn.readable.pipeThrough(new ZodStream(Schema)).pipeTo(session.writable);
    session.readable.pipeThrough(new ZodStream(Schema)).pipeTo(conn.writable);

    return {
        conn,
        session,
    };
}

/**
 * directly connect a client to a hub without any intermediary serialization
 */
export function attach_direct_to_hub(hub: RPCHub, client: RPCClient): {
    conn: RPCHubClient;
    session: RPCSession;
} {
    const conn = new RPCHubClient(hub);
    const session = new RPCSession(client);
    // zod needed for default values
    conn.readable.pipeThrough(new ZodStream(Schema)).pipeTo(session.writable);
    session.readable.pipeThrough(new ZodStream(Schema)).pipeTo(conn.writable);

    return {
        conn,
        session,
    };
}
