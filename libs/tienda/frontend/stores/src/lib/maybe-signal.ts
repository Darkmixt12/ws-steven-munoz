import { isSignal, type Signal } from '@angular/core';

export type MaybeSignal<T> = T | Signal<T>;

export function readMaybeSignal<T>(value: MaybeSignal<T>): T {
  return isSignal(value) ? (value as Signal<T>)() : (value as T);
}
