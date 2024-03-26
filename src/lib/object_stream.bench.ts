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

import { decode, encode } from "./object_stream.ts";
import { Encoder } from "../deps.ts";
import { desia, sia } from "npm:sializer";

Deno.bench(`Encode MsgPackr`, {
    group: "enc",
}, () => {
    encode({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    });
});

Deno.bench(`Encode JSON`, {
    group: "enc",
    baseline: true,
}, () => {
    JSON.stringify({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    });
});

Deno.bench(`Encode Sia`, {
    group: "enc",
}, () => {
    sia({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    });
});

const enc = new Encoder();
Deno.bench(`Encode CBOR`, {
    group: "enc",
}, () => {
    enc.encode({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    });
});

Deno.bench(`Decode MsgPackr`, {
    group: "dec",
}, () => {
    decode(encode({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    }));
});

Deno.bench(`Decode JSON`, {
    group: "dec",
    baseline: true,
}, () => {
    JSON.parse(JSON.stringify({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    }));
});

Deno.bench(`Decode Sia`, {
    group: "dec",
}, () => {
    desia(sia({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    }));
});

const dec = new Encoder();
Deno.bench(`Decode CBOR`, {
    group: "dec",
}, () => {
    dec.decode(enc.encode({
        a: 45,
        b: {
            foo: "test",
        },
        c: null,
    }));
});
