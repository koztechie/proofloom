export type Nullable<T> = T | null;

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type StrictOmit<T, K extends keyof T> = Omit<T, K> & Partial<Record<K, never>>;
