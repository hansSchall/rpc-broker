import { SignalI, SignalO } from "../schema.ts";
import { RPCSession } from "./session.ts";
import { RPCClient } from "./client.ts";
import { batch, computed, effect, Signal, signal } from "@preact/signals";
import { AGGREGATION_TIMEOUT } from "./client.ts";
import { decode, encode } from "../lib/object_stream.ts";

export const SIGNAL_INVALID = Symbol("SIGNAL_INVALID");
export type SIGNAL_INVALID = typeof SIGNAL_INVALID;

export class RPCSignal {
    private constructor(readonly id: string, readonly client: RPCClient) {
        effect(() => {
            this.update();
        });
    }

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

    public _reset() {
        this.had_signal = false;
        this.update();
    }

    public _off() {
        this.remote_valid.value = false;
        this.holding_remote.value = false;
        this.had_signal = false;
    }

    private had_signal = false;
    private num_requests = signal(0);
    private remote_value = signal<unknown>(SIGNAL_INVALID);
    private remote_valid = signal<boolean>(false);
    private holding_remote = signal<boolean>(false);

    get value() {
        return this.current.value;
    }

    readonly current = computed(() => this.remote_valid.value ? this.remote_value.value : SIGNAL_INVALID);

    /**
     * request a signal (without requesting the signal is invalid)
     * @returns Function that should be called when the signal is no longer needed
     */
    public request() {
        this.num_requests.value++;
        return () => {
            setTimeout(() => {
                this.num_requests.value--;
            }, AGGREGATION_TIMEOUT);
        };
    }

    private transmitter = signal<Signal<unknown> | null>(null);

    private send_src(data: SignalO, src?: RPCSession) {
        (src ?? this.client._active_session.value)?.push_signal(this.id, data, () => null);
    }

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
