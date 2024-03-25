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

import { ReadonlySignal, useComputed, useEffect, useMemo, useSignal, z } from "../deps.ts";
import { RPCClient } from "../mod.ts";
import { SIGNAL_INVALID } from "./signal.ts";

export class ClientHooks {
    readonly client?: RPCClient;

    public useSignal(id: string) {
        const current_signal = useMemo(() => this.client!.signal(id), [id]);
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

    public useZodSignal<T extends z.ZodTypeAny, F = z.infer<T>>(
        id: string,
        schema: T,
        fallback: F,
    ): ReadonlySignal<z.infer<T> | F> {
        const signal = this.useSignal(id);
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

    public useBoolSignal<F = boolean>(id: string, fallback: F): ReadonlySignal<boolean | F> {
        const signal = this.useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            } else {
                return Boolean(signal.value);
            }
        });
    }

    public useNumberSignal<F = number>(id: string, fallback: F): ReadonlySignal<number | F> {
        const signal = this.useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            } else {
                return Number(signal.value);
            }
        });
    }

    public useStringSignal<F = string>(id: string, fallback: F): ReadonlySignal<string | F> {
        const signal = this.useSignal(id);
        return useComputed(() => {
            if (signal.value === SIGNAL_INVALID) {
                return fallback;
            } else {
                return String(signal.value);
            }
        });
    }

    public useSignalTransmitter(id: string, input: ReadonlySignal) {
        const signal = useMemo(() => this.client!.signal(id), [id]);
        useEffect(() => {
            signal.transmit(input);
            return () => {
                signal.transmit(null);
            };
        }, [signal]);
    }
}
