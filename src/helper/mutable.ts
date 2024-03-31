/**
 * Source: {@link https://stackoverflow.com/a/62038378}
 * @license CC-BY-SA-4.0
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
