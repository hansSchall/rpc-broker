# RPC-Broker (WIP)

RPC-Broker is a transport-layer-agnostic RPC communication library. Additionally to routing RPC calls it supports
transmitting [Preact Signals](https://github.com/preactjs/signals) between the clients.

It is built on [WebStreams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API),
[MessagePack](https://msgpack.org/) and [Zod](https://zod.dev/). It is developed using [Deno.js](https://deno.com/), but
also runs in Node.js and Browsers.

Adapters for WebSockets are builtin, but it works over any transport layer that is able to transmit binary data (raw TCP
streams, serial/RS232, WebRTC DataChannels, ...). If the transport layer directly supports JS object cloning (e.g worker
processes) the binary serialization can be skipped.

## Installation

https://jsr.io/@hansschall/rpc-broker

## Usage

RPC-Broker does not implement the classic client/server concept. It does not distinguish between RPC callers and RPC
provider, between signal source and signal sink. The classic RPC provider is just a regular client of the broker server.

If the RPC provider and the broker server run in the same process, `RPCServer.client` can be used. It is an
automatically connected `RPCClient`, without any intermediary serialization.

The following examples use the simplest API possible, for more detailed information, please refer to the API section.

### RPC Client

```ts
const client = new WebsocketClient(new RPCClient(), new URL(`ws://example.com/socket`));
```

For custom transport layers, please refer to the API section

### RPC Calls

RPC calls consist of three parts: `mod` (to which you can subscribe, equivalent the the HTTP path), `sub` (equivalent to
the HTTP method) and (optionally) `arg`. `mod` and `sub` are strings, `arg` is any object MessagePack can handle. It is
_**HIGHLY RECOMMENDED**_ to _**ALWAYS**_ validate the `arg`. When using TypeScript, _**DO NOT USE**_ the `as` operator,
this is _**UNSAFE**_. Use _**FULL**_ type checks. Do this either manually (not recommended) or using a library like
[zod](https://zod.dev/) (recommended, internally used) or [TypeBox](https://github.com/sinclairzx81/typebox)

```ts
client.subscribe(`my.api`, (sub: string, arg: unknown) => {
    // validate and handle the call
});

client.call(`my.api`, "delete", { id: 5 });
```

### RPC Signals

1. Use `RPCClient.signal` to obtain a `RPCSignal` handle.
2. Use the `RPCSignal.transmit` method to transmit a signal
3. Use the `RPCSignal.request` method to start receiving value updates
4. Access the current value with `RPCSignal.value`
5. Call `release` when you do not need the signal anymore (saves resources and bandwidth)

It is _**HIGHLY RECOMMENDED**_ to _**ALWAYS**_ validate the signal value. When using TypeScript, _**DO NOT USE**_ the
`as` operator, this is _**UNSAFE**_. Use _**FULL**_ type checks. Do this either manually (not recommended) or using a
library like [zod](https://zod.dev/) (recommended, internally used) or
[TypeBox](https://github.com/sinclairzx81/typebox). The Signal can become `SIGNAL_INVALID` at any time (no signal
sender, network connection lost, ...)

```ts
const mySignal = signal("foo");
client.signal(`my.signal`).transmit(mySignal);

const myReceivedSignal = client.signal(`my.signal`);
const release = myReceivedSignal.request();
effect(() => {
    console.log(myReceivedSignal.value);
});
```

The library provides wrapper functions to easily access signals from Preact Components (React support is underway).
These include type checks and data fallbacks.

```tsx
function MyComponent() {
    const value = client.useStringSignal("my.signal", "loading...");
    return (
        <div>
            {value}
        </div>
    );
}
```

### RPCServer

To build a WebSocket RPCServer, use `serve_websocket` from `helpers/websocket_server.ts`. If you need more granular
control, use `upgrade_websocket`. If you want to use a custom transport layer, refer to the API Section.

## API

// TODO

## License

Copyright (C) 2024 Hans Schallmoser

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program. If not, see
<https://www.gnu.org/licenses/>.
