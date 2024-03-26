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

import { attach_direct } from "../helper/attach_direct.ts";
import { RPCClient, RPCServer } from "../mod.ts";
import { effect } from "../deps.ts";

function test(c: number, a: number) {
    return async (b: Deno.BenchContext) => {
        const server = new RPCServer(a);
        const clientA = new RPCClient(a);
        const clientB = new RPCClient(a);
        attach_direct(server, clientA);
        attach_direct(server, clientB);
        await new Promise<void>((res) => {
            effect(() => {
                if (clientA.connected && clientB.connected) {
                    b.start();
                    clientB.mod("foo").subscribe((_sub, arg) => {
                        if (arg === c) {
                            b.end();
                            res();
                        }
                    });

                    for (let i = 0; i <= c; i++) {
                        clientA.mod("foo").call("bar", i);
                    }
                }
            });
        });
    };
}

for (const c of [1, 100, 1_000, 10_000]) {
    for (const a of [0, 1]) {
        Deno.bench(`mode=default c=${c} a=${a}`, {
            group: "RPC Call",
        }, test(c, a));
    }
}

// Deno.bench("m=dir c=100 a=0ms", {
//     group: "RPC Call"
// }, test(100, 0));

// Deno.bench("m=dir c=100 a=1ms", {
//     group: "RPC Call"
// }, test(100, 1));

// Deno.bench("m=dir c=100 a=2ms", {
//     group: "RPC Call"
// }, test(100, 2));

// Deno.bench("m=dir c=1000 a=0ms", {
//     group: "RPC Call"
// }, test(1000, 0));

// Deno.bench("m=dir c=1000 a=1ms", {
//     group: "RPC Call"
// }, test(1000, 1));

// Deno.bench("m=dir c=1000 a=2ms", {
//     group: "RPC Call"
// }, test(1000, 2));
