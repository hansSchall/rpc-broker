export class StreamedWebSocket {
    constructor(readonly ws: WebSocket) {
        ws.binaryType = "arraybuffer";
        ws.addEventListener("message", (ev) => {
            this.sender?.enqueue(new Uint8Array(ev.data));
        });
    }
    private sender?: ReadableStreamDefaultController<Uint8Array>;
    readonly readable = new ReadableStream<Uint8Array>({
        start: (controller) => {
            this.sender = controller;
        },
        cancel: () => {
            this.ws.close();
        },
    });
    readonly writable = new WritableStream<Uint8Array>({
        write: (chunk) => {
            this.ws.send(chunk);
        },
    });
}
