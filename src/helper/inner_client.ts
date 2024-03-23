import { RPCClient } from "../client/client.ts";
import { RPCSession } from "../client/session.ts";
import { ZodStream } from "../lib/zod_stream.ts";
import { Schema } from "../schema.ts";
import { RPCConnection } from "../server/conn.ts";
import { RPCServer } from "../server/server.ts";

export function attach_direct(server: RPCServer, client: RPCClient) {
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
