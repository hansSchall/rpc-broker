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

import { PackrStream } from "../mod.ts";
import { UnpackrStream } from "../mod.ts";
import { type RPCClient, RPCSession, Schema, ZodStream } from "../mod.ts";

/**
 * use anything that implements readable/writable streams a client uplink
 */
export function attach_uplink(client: RPCClient, uplink: {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<Uint8Array>;
}): {
    session: RPCSession;
} {
    const session = new RPCSession(client);

    uplink.readable.pipeThrough(new UnpackrStream()).pipeThrough(new ZodStream(Schema)).pipeTo(session.writable);
    session.readable.pipeThrough(new PackrStream()).pipeTo(uplink.writable);

    return {
        session,
    };
}
