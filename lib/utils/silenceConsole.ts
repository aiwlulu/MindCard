import type { SilenceConsoleOptions } from "@/lib/types";

type ConsoleMethod = "log" | "warn" | "error" | "info" | "debug" | "time" | "timeEnd";

const METHODS: ConsoleMethod[] = ["log", "warn", "error", "info", "debug", "time", "timeEnd"];

function silenceConsole({ blackList = [] }: SilenceConsoleOptions): void {
  if (typeof window === "undefined" || blackList.length === 0) return;

  const isBlocked = (args: unknown[]) =>
    args.some(
      (arg) => typeof arg === "string" && blackList.some((kw) => arg.includes(kw))
    );

  for (const name of METHODS) {
    const original = console[name].bind(console) as (...args: unknown[]) => void;
    console[name] = ((...args: unknown[]) => {
      if (!isBlocked(args)) original(...args);
    }) as Console[typeof name];
  }

  window.onerror = (message) =>
    typeof message === "string" && blackList.some((kw) => message.includes(kw));
}

export default silenceConsole;
