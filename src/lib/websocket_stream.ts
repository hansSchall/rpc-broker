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

export class StreamedWebSocket {
    constructor(readonly ws: WebSocket) {
        ws.binaryType = "arraybuffer";
        ws.addEventListener("message", (ev) => {
            this.sender?.enqueue(new Uint8Array(ev.data));
        });
        ws.addEventListener("close", () => {
            this.readable.cancel();
            this.writable.close();
        });
    }
    private sender?: ReadableStreamDefaultController<Uint8Array>;
    readonly readable = new ReadableStream<Uint8Array>({
        start: (controller) => {
            this.sender = controller;
        },
        cancel: () => {
            this.ws.close();
        },
    });
    readonly writable = new WritableStream<Uint8Array>({
        write: (chunk) => {
            this.ws.send(chunk);
        },
    });
}
