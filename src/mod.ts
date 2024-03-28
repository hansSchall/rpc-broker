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

export { RPCConnection, RPCServer } from "./server/server.ts";
export * as server from "./server/server.ts";
export { RPCClient, RPCClientImpl, RPCSession } from "./client/client.ts";
export * as client from "./client/client.ts";
export { RPCHub, RPCHubClient } from "./hub/hub.ts";
export * as hub from "./hub/hub.ts";

export { attach_direct, attach_direct_to_hub } from "./helper/attach_direct.ts";
export { attach_uplink } from "./helper/attach_uplink.ts";
export { attach_websocket } from "./helper/attach_websocket.ts";
export type { Mutable } from "./helper/mutable.ts";
export { WebsocketClient } from "./helper/websocket_client.ts";

export { decode, encode, PackrStream, UnpackrStream } from "./lib/object_stream.ts";
export { StreamedWebSocket } from "./lib/websocket_stream.ts";
export { check_stream, ZodStream } from "./lib/zod_stream.ts";
export { Schema } from "./schema.ts";
export type { SchemaI, SchemaO, SchemaStatic } from "./schema.ts";
