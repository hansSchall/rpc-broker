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

import type { SignalI, SignalO } from "../schema.ts";
import type { RPCClient } from "./client.ts";
import { batch, computed, effect, type ReadonlySignal, type Signal, signal } from "../deps.ts";
import { decode, encode } from "../lib/object_stream.ts";

export const SIGNAL_INVALID = Symbol("SIGNAL_INVALID");
export type SIGNAL_INVALID = typeof SIGNAL_INVALID;

export class RPCSignal {
    private constructor(readonly id: string, readonly client: RPCClient) {
        effect(() => {
            this.update();
        });

        effect(() => {
            this.send_src({
                s: this.requested.value,
            });
        });
    }

    /**
     * @internal
     */
    public _handle({ v: value, d: drop, h: hold }: SignalI) {
        if (drop) {
            this.remote_valid.value = false;
        } else if (value) {
            batch(() => {
                try {
                    this.remote_value.value = decode(value);
                    this.remote_valid.value = true;
                } catch (err) {
                    this.remote_valid.value = false;
                    console.error(`Signal Invalid`, err);
                }
            });
        }

        if (hold !== undefined) {
            this.holding_remote.value = hold;
        }
    }

    private update() {
        if (this.transmitter.value) {
            this.had_signal = true;
            this.send_src({
                v: encode(this.transmitter.value?.value),
            });
        } else if (this.had_signal) {
            this.send_src({
                d: true,
            });
        }
    }

    /**
     * @internal
     */
    public _reset() {
        this.had_signal = false;
        this.update();
    }

    /**
     * @internal
     */
    public _off() {
        this.remote_valid.value = false;
        this.holding_remote.value = false;
        this.had_signal = false;
    }

    private had_signal: boolean = false;
    private num_requests: Signal<number> = signal(0);
    private requested: ReadonlySignal<boolean> = computed(() => this.num_requests.value > 0);
    private remote_value: Signal<unknown> = signal(SIGNAL_INVALID);
    private remote_valid: Signal<boolean> = signal(false);
    private holding_remote: Signal<boolean> = signal(false);

    /**
     * current value (short for `RPCSignal.current.value`)
     */
    get value(): unknown | SIGNAL_INVALID {
        return this.current.value;
    }

    /**
     * current value as Signal
     */
    readonly current: ReadonlySignal<unknown | SIGNAL_INVALID> = computed(() => {
        if (this.holding_remote.value && this.transmitter.value) {
            return this.transmitter.value.value;
        } else if (this.remote_valid.value) {
            return this.remote_value.value;
        } else {
            return SIGNAL_INVALID;
        }
    });

    /**
     * request a signal (without requesting the signal is invalid)
     * @returns Function that should be called when the signal is no longer needed (the signal will be unsubscribed when all requests have been released)
     */
    public request(): VoidFunction {
        this.num_requests.value++;
        let released = false;
        return () => {
            if (!released) {
                released = true;
                setTimeout(() => {
                    this.num_requests.value--;
                }, this.client.aggregate);
            }
        };
    }

    private transmitter = signal<ReadonlySignal<unknown> | null>(null);

    /**
     * Start/Stop transmitting a signal value
     * @param value null stops transmitting
     */
    public transmit(value: ReadonlySignal | null) {
        this.transmitter.value = value;
    }

    private send_src(data: SignalO) {
        this.client._active_session.value?._push_signal(this.id, data, () => null);
    }

    /**
     * Obtain a RPCSignal handle for the given client.
     * This function ensures there will be only one instance of one signal (singleton)
     * @internal
     */
    public static get(client: RPCClient, id: string): RPCSignal {
        if (client._signals.has(id)) {
            return client._signals.get(id)!;
        } else {
            const sig = new RPCSignal(id, client);
            client._signals.set(id, sig);
            return sig;
        }
    }
}
