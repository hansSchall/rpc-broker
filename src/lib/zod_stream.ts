import { z } from "zod";

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
