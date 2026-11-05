declare module 'xterm-pty' {
  interface Disposable {
    dispose(): void;
  }

  interface TerminalPort {
    write(data: string | Uint8Array, callback?: () => void): void;
    onData(callback: (data: string) => void): Disposable;
    onBinary(callback: (data: string) => void): Disposable;
    onResize(callback: (size: { cols: number; rows: number }) => void): Disposable;
  }

  interface PtyMaster {
    activate(terminal: TerminalPort): void;
    dispose(): void;
  }

  interface PtySlave {
    readonly readable: boolean;
    readonly writable: boolean;
    read(length?: number): number[];
    write(data: string | number[]): void;
    onReadable(callback: () => void): Disposable;
    onWritable(callback: () => void): Disposable;
    onSignal(callback: (signal: 'SIGINT' | 'SIGQUIT' | 'SIGTSTP' | 'SIGWINCH') => void): Disposable;
    ioctl(request: 'TCGETS'): unknown;
    ioctl(request: 'TCSETS', value: unknown): void;
    ioctl(request: 'TIOCGWINSZ'): [number, number];
  }

  export function openpty(): { master: PtyMaster; slave: PtySlave };
}
