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

import { SIGNAL_INVALID } from "../client/signal.ts";
import type { RPCSignal } from "../client/signal.ts";
import { effect, signal } from "../deps.ts";
import { decode, encode } from "../lib/object_stream.ts";
import type { SignalI, SignalO } from "../schema.ts";
import { merge_signal } from "../server/merge_signal.ts";
import type { RPCHub } from "./hub.ts";
import type { RPCHubClient } from "./hubClient.ts";

/**
 * @internal
 */
export class RPCHubSignal {
    private constructor(readonly hub: RPCHub, readonly id: string) {
        this.uplink_signal = hub.client.signal(id);
        effect(() => {
            const value = this.uplink_signal.value;
            this.update(value !== SIGNAL_INVALID ? encode(value) : null);
        });
    }

    readonly uplink_signal: RPCSignal;

    private subscriptions = new Set<RPCHubClient>();
    public subscribe(conn: RPCHubClient) {
        this.subscriptions.add(conn);
        this.releases.set(conn, this.hub.client.signal(this.id).request());
        this.send_value(conn);
    }
    public unsubscribe(conn: RPCHubClient) {
        this.subscriptions.delete(conn);
        this.releases.get(conn)?.();
    }

    private owner: null | RPCHubClient = null;
    private current_value: Uint8Array | null = null;

    private update(value: Uint8Array | null) {
        this.current_value = value;
        for (const $ of this.subscriptions) {
            this.send_value($);
        }
    }

    private releases = new Map<RPCHubClient, VoidFunction>();
    private uplink_value = signal<unknown>(null);

    /**
     * @internal
     */
    public _handle({ v: value, d: drop, s: subscribe }: SignalI, src: RPCHubClient) {
        if (subscribe === true) {
            this.subscribe(src);
        } else if (subscribe === false) {
            this.unsubscribe(src);
        }
        if (src === this.owner) {
            if (drop === true) {
                this.uplink_signal.transmit(null);
            } else if (value) {
                this.uplink_value.value = decode(value);
                this.uplink_signal.transmit(this.uplink_value);
            }
        } else {
            if (this.owner === null) {
                if (value?.length && !drop) {
                    this.owner = src;
                    this.uplink_value.value = decode(value);
                    this.uplink_signal.transmit(this.uplink_value);
                    this.send_src({
                        h: true,
                    }, src);
                }
            }
        }
    }

    private send_value(to: RPCHubClient) {
        if (this.current_value) {
            this.send_src({
                v: this.current_value,
            }, to);
        } else {
            this.send_src({
                d: true,
            }, to);
        }
    }

    private send_src(data: SignalO, src: RPCHubClient) {
        src._push_signal(this.id, data, merge_signal);
    }

    public static get(hub: RPCHub, id: string): RPCHubSignal {
        if (hub._hub_signals.has(id)) {
            return hub._hub_signals.get(id)!;
        } else {
            const sig = new RPCHubSignal(hub, id);
            hub._hub_signals.set(id, sig);
            return sig;
        }
    }
    /**
     * @internal
     */
    public static _drop_conn(conn: RPCHubClient) {
        for (const [, mod] of conn.hub._hub_signals) {
            mod.unsubscribe(conn);
            if (conn === mod.owner) {
                mod.update(null);
            }
        }
    }
}
