/**
 * @license CC-BY-SA-4.0
 */
// https://stackoverflow.com/a/62038378
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
