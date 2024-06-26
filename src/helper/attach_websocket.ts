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

import { PackrStream, UnpackrStream } from "../lib/object_stream.ts";
import { StreamedWebSocket } from "../lib/websocket_stream.ts";
import { ZodStream } from "../lib/zod_stream.ts";
import { Schema, type SchemaI, type SchemaO } from "../schema.ts";

/**
 * Wrapper for {@link RPCSession} or {@link RPCConnection}
 */
export interface SessionLike {
    readonly readable: ReadableStream<SchemaO>;
    readonly writable: WritableStream<SchemaI>;
    dispose(): void;
}

/**
 * attaches a websocket to a {@link SessionLike}
 */
export function attach_websocket(session: SessionLike, ws: WebSocket) {
    const streamed = new StreamedWebSocket(ws);

    streamed.readable
        .pipeThrough(new UnpackrStream())
        .pipeThrough(new ZodStream(Schema))
        .pipeTo(session.writable);

    session.readable
        .pipeThrough(new PackrStream())
        .pipeTo(streamed.writable);
}
