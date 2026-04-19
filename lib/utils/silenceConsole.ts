import type { SilenceConsoleOptions } from "@/lib/types";

function silenceConsole(options: SilenceConsoleOptions): void {
  const blackList = options.blackList ?? [];

  if (typeof window === "undefined") return;

  const originalLog = console.log;
  console.log = function (...args: unknown[]) {
    const blocked = args.some(
      (arg) =>
        typeof arg === "string" &&
        blackList.some((keyword) => arg.includes(keyword))
    );
    if (!blocked) originalLog.apply(console, args as Parameters<typeof originalLog>);
  };

  const originalError = console.error;
  console.error = function (...args: unknown[]) {
    const blocked = args.some(
      (arg) =>
        typeof arg === "string" &&
        blackList.some((keyword) => arg.includes(keyword))
    );
    if (!blocked) originalError.apply(console, args as Parameters<typeof originalError>);
  };

  const originalTime = console.time;
  console.time = function (label?: string) {
    if (!label || !blackList.includes(label)) {
      originalTime.call(console, label);
    }
  };

  const originalTimeEnd = console.timeEnd;
  console.timeEnd = function (label?: string) {
    if (!label || !blackList.includes(label)) {
      originalTimeEnd.call(console, label);
    }
  };

  window.onerror = function (message) {
    if (typeof message === "string" && blackList.some((kw) => message.includes(kw))) {
      return true;
    }
    return false;
  };
}

export default silenceConsole;
