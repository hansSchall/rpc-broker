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

import { type ReadonlySignal, useComputed, useEffect, useMemo, useSignal, type z } from "../deps.ts";
import type { RPCClient } from "../mod.ts";
import { type RPCCallback, RPCMod } from "./call.ts";
import { RPCSignal, SIGNAL_INVALID } from "./signal.ts";

/**
 * Defines the api available on RPCClient and RPCClientImpl
 */
export abstract class ClientAPI {
    abstract readonly client: RPCClient;

    /**
     * Get RPCSignal handle
     */
    public signal(id: string): RPCSignal {
        return RPCSignal.get(this.client, id);
    }

    /**
     * Get RPCMod handle
     */
    public mod(id: string): RPCMod {
        return RPCMod.get(this.client, id);
    }

    /**
     * Subscribe to rpc calls
     * Short for .mod(...).subscribe(...)
     */
    public subscribe(id: string, cb: RPCCallback): RPCMod {
        return RPCMod.get(this.client, id).subscribe(cb);
    }

    /**
     * Start RPC Call
     * Short for .mod(...).call(...)
     */
    public call(id: string, sub: string, arg?: unknown) {
        RPCMod.get(this.client, id).call(sub, arg);
    }

    /**
     * preact hook to request RPC Signal and get its value
     * Note: Although Preact Signals are used, this is a regular hook and has to be called from the unbranched part of the component
     * @internal
     */
    public _useSignal(id: string): ReadonlySignal<unknown> {
        const current_signal = useMemo(() => this.signal(id), [id]);
        const signal_signal = useSignal(current_signal);
        useEffect(() => {
            signal_signal.value = current_signal;
            const release = current_signal.request();
            return () => {
                release();
            };
        }, [current_signal]);
        return useComputed(() => signal_signal.value.value);
    }

    /**
     * Note: Although Preact Signals are used, this is a regular hook and has to be called from the unbranched part of the component
     * @param schema Zod schema that is used to validate the signal
     * @param fallback Fallback value that is used when the Signal value is unavailable or invalid
     */
    public useZodSignal<T extends z.ZodTypeAny, F = z.infer<T>>(
        id: string,
        schema: T,
        fallback: F,
    ): ReadonlySignal<z.infer<T> | F> {
        const signal = this._useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            }
            const res = schema.safeParse(signal.value);
            if (res.success) {
                return res.data;
            } else {
                console.log(`Invalid Signal value`, res.error);
                return fallback;
            }
        });
    }

    /**
     * Automatically casts the value to boolean
     * Note: Although Preact Signals are used, this is a regular hook and has to be called from the unbranched part of the component
     * @param fallback Fallback value that is used when the Signal value is unavailable or invalid
     */
    public useBoolSignal<F = boolean>(id: string, fallback: F): ReadonlySignal<boolean | F> {
        const signal = this._useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            } else {
                return Boolean(signal.value);
            }
        });
    }

    /**
     * Automatically casts the value to number
     * Note: Although Preact Signals are used, this is a regular hook and has to be called from the unbranched part of the component
     * @param fallback Fallback value that is used when the Signal value is unavailable or invalid
     */
    public useNumberSignal<F = number>(id: string, fallback: F): ReadonlySignal<number | F> {
        const signal = this._useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            } else {
                return Number(signal.value);
            }
        });
    }

    /**
     * Automatically casts the value to string
     * Note: Although Preact Signals are used, this is a regular hook and has to be called from the unbranched part of the component
     * @param fallback Fallback value that is used when the Signal value is unavailable or invalid
     */
    public useStringSignal<F = string>(id: string, fallback: F): ReadonlySignal<string | F> {
        const signal = this._useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            } else {
                return String(signal.value);
            }
        });
    }

    /**
     * Hook to transmit a RPC Signal
     */
    public useSignalTransmitter(id: string, input: ReadonlySignal) {
        const signal = useMemo(() => this.signal(id), [id]);
        useEffect(() => {
            signal.transmit(input);
            return () => {
                signal.transmit(null);
            };
        }, [signal]);
    }
}
