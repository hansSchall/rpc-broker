import { SignalO } from "../schema.ts";

export function merge_signal(
    { v: a_value, d: a_drop, h: a_hold }: SignalO,
    { v: b_value, d: b_drop, h: b_hold }: SignalO,
): SignalO | null {
    let r_hold: boolean | undefined = undefined;
    if (a_hold === b_hold) {
        r_hold = a_hold;
    } else {
        if (a_hold === undefined) {
            // b_hold !== undefined
            r_hold = b_hold;
        } else if (b_hold === undefined) {
            // a_hold !== undefined
            r_hold = a_hold;
        } else {
            return null;
        }
    }

    const a_update = a_drop ? null : a_value;
    const b_update = b_drop ? null : b_value;

    let r_update: Uint8Array | null | undefined = null;

    if (b_update === undefined) {
        r_update = a_update;
    } else {
        r_update = b_update;
    }

    let r_value: Uint8Array | undefined = undefined;
    let r_drop: true | undefined = undefined;
    if (r_update === null) {
        r_drop = true;
    } else {
        r_value = r_update;
    }

    return {
        v: r_value,
        d: r_drop,
        h: r_hold,
    };
}
