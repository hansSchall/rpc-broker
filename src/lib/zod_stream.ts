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

import type { z } from "../deps.ts";

export class ZodStream<Schema extends z.ZodType> extends TransformStream<unknown, z.infer<Schema>> {
    constructor(readonly schema: Schema) {
        super({
            transform: (chunk, controller) => {
                const parsed = schema.safeParse(chunk);
                if (parsed.success) {
                    controller.enqueue(parsed.data);
                } else {
                    console.error(`[ZodStream] [InvalidData]`, parsed.error);
                }
            },
        });
    }
}
