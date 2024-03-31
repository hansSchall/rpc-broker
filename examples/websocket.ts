import { effect, signal } from "../src/deps.ts";
import {
    check_stream,
    PackrStream,
    RPCClient,
    RPCConnection,
    RPCServer,
    StreamedWebSocket,
    UnpackrStream,
    WebsocketClient,
} from "../src/mod.ts";

function main() {
    const server = new RPCServer();

    Deno.serve({
        port: 8000,
        onListen: ({ hostname, port }) => {
            console.log(`listening on ws://${hostname}:${port}/`);
        },
    }, (req) => {
        const { socket, response } = Deno.upgradeWebSocket(req);

        const conn = new RPCConnection(server);

        const streamed = new StreamedWebSocket(socket);

        streamed.readable
            .pipeThrough(new UnpackrStream())
            .pipeThrough(check_stream())
            .pipeTo(conn.writable);

        conn.readable
            .pipeThrough(new PackrStream())
            .pipeTo(streamed.writable);

        return response;
    });

    {
        const client = new RPCClient();
        new WebsocketClient(client, new URL(`ws://127.0.0.1:8000/`));
        const sig = client.signal("counter");
        sig.request();
        effect(() => {
            console.log(sig.value);
        });
    }
    {
        const client = new RPCClient();
        new WebsocketClient(client, new URL(`ws://127.0.0.1:8000/`));
        const counter = signal(0);
        setInterval(() => {
            counter.value++;
        }, 1000);

        client.signal("counter").transmit(counter);
    }
}

main();
