import 'v86';
import type { V86Image } from 'v86';

declare module 'v86' {
  interface V86Options {
    bootrom?: V86Image;
  }

  interface V86 {
    set_hda_write_callback(callback: (start: number, length: number) => void): void;
  }
}
