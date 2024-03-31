import { effect, signal } from "../src/deps.ts";
import { attach_direct, RPCClient, RPCServer } from "../src/mod.ts";

function main() {
    const server = new RPCServer();
    const counter = signal(0);
    setInterval(() => {
        counter.value++;
    }, 1000);

    server.client.signal("counter").transmit(counter);

    const otherClient = new RPCClient();
    attach_direct(server, otherClient);

    const sig = otherClient.signal("counter");
    sig.request();

    effect(() => {
        console.log(sig.value);
    });
}

main();
