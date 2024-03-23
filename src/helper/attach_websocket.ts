import { PackrStream, UnpackrStream } from "../lib/object_stream.ts";
import { StreamedWebSocket } from "../lib/websocket_stream.ts";
import { ZodStream } from "../lib/zod_stream.ts";
import { Schema, SchemaI, SchemaO } from "../schema.ts";

export interface SessionLike {
    readonly readable: ReadableStream<SchemaO>;
    readonly writable: WritableStream<SchemaI>;
    dispose(): void;
}

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
