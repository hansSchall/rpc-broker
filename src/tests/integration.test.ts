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

import { assertEquals } from "https://deno.land/std@0.214.0/assert/assert_equals.ts";
import { attach_direct, attach_direct_to_hub } from "../helper/attach_direct.ts";
import { RPCClient, RPCServer } from "../mod.ts";
import { effect, signal } from "../deps.ts";
import { SIGNAL_INVALID } from "../client/signal.ts";
import { RPCHub } from "../hub/hub.ts";

function assertCall(timeout = 500) {
    let res = () => {};
    let to = 0;
    const wait = new Promise<void>((resolve) => {
        to = setTimeout(() => {
            resolve();
        }, timeout);
        res = resolve;
    });

    let calls = 0;

    return {
        call: () => {
            calls++;
            clearTimeout(to);
            res();
        },
        finish: async () => {
            await wait;
            assertEquals(calls, 1);
        },
    };
}

Deno.test("RPC Call", async () => {
    const server = new RPCServer();
    const clientA = new RPCClient();
    const clientB = new RPCClient();
    attach_direct(server, clientA);
    attach_direct(server, clientB);
    const call = assertCall();
    effect(() => {
        if (clientA.connected && clientB.connected) {
            clientB.mod("foo").subscribe((sub, arg) => {
                assertEquals(sub, "bar");
                assertEquals(arg, {
                    foo: 5,
                });
                call.call();
            });

            clientA.mod("foo").call("bar", {
                foo: 5,
            });
        }
    });

    await call.finish();
});

Deno.test("RPC Hub/down Call", async () => {
    const server = new RPCServer();
    const clientA = new RPCClient();
    const clientB = new RPCClient();
    const hub = new RPCHub();
    attach_direct(server, clientA);
    attach_direct(server, hub);
    attach_direct_to_hub(hub, clientB);
    const call = assertCall();
    effect(() => {
        if (clientA.connected && clientB.connected) {
            clientB.mod("foo").subscribe((sub, arg) => {
                assertEquals(sub, "bar");
                assertEquals(arg, {
                    foo: 5,
                });
                call.call();
            });

            setTimeout(() => {
                clientA.mod("foo").call("bar", {
                    foo: 5,
                });
            }, 100); // subscription needs time
        }
    });

    await call.finish();
});

Deno.test("RPC Hub/up Call", async () => {
    const server = new RPCServer();
    const clientA = new RPCClient();
    const clientB = new RPCClient();
    const hub = new RPCHub();
    attach_direct(server, clientA);
    attach_direct(server, hub);
    attach_direct_to_hub(hub, clientB);
    const call = assertCall();
    effect(() => {
        if (clientA.connected && clientB.connected) {
            clientA.mod("foo").subscribe((sub, arg) => {
                assertEquals(sub, "bar");
                assertEquals(arg, {
                    foo: 5,
                });
                call.call();
            });

            clientB.mod("foo").call("bar", {
                foo: 5,
            });
        }
    });

    await call.finish();
});

Deno.test("RPC Signal", async () => {
    const server = new RPCServer();
    const clientA = new RPCClient();
    const clientB = new RPCClient();
    attach_direct(server, clientA);
    attach_direct(server, clientB);
    const call = assertCall();
    const recv = clientB.signal("foo");
    recv.request();
    effect(() => {
        if (recv.value !== SIGNAL_INVALID) {
            assertEquals(recv.value, 5);
            call.call();
        }
    });

    const send = signal(5);

    clientA.signal("foo").transmit(send);

    await call.finish();
});

Deno.test("RPC Hub/down Signal", async () => {
    const server = new RPCServer();
    const clientA = new RPCClient();
    const clientB = new RPCClient();
    const hub = new RPCHub();
    attach_direct(server, clientA);
    attach_direct(server, hub);
    attach_direct_to_hub(hub, clientB);
    const call = assertCall();
    const recv = clientB.signal("foo");
    recv.request();
    effect(() => {
        if (recv.value !== SIGNAL_INVALID) {
            assertEquals(recv.value, 5);
            call.call();
        }
    });

    const send = signal(5);

    clientA.signal("foo").transmit(send);

    await call.finish();
});

Deno.test("RPC Hub/up Signal", async () => {
    const server = new RPCServer();
    const clientA = new RPCClient();
    const clientB = new RPCClient();
    const hub = new RPCHub();
    attach_direct(server, clientA);
    attach_direct(server, hub);
    attach_direct_to_hub(hub, clientB);
    const call = assertCall();
    const recv = clientA.signal("foo");
    recv.request();
    effect(() => {
        if (recv.value !== SIGNAL_INVALID) {
            // assertEquals(recv.value, 5);
            call.call();
        }
    });

    const send = signal(5);

    clientB.signal("foo").transmit(send);

    await call.finish();
});
