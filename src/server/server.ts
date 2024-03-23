import { RPCConnection } from "./conn.ts";
import { RPCMod } from "./call.ts";
import { RPCSignal } from "./signal.ts";

export const AGGREGATION_TIMEOUT = 2;

export class RPCServer {
    constructor() {
    }
    readonly clients = new Set<RPCConnection>();
    readonly mods = new Map<string, RPCMod>();
    readonly signals = new Map<string, RPCSignal>();
}
