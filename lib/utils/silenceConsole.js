function silenceConsole() {
  if (typeof window !== "undefined") {
    const blackList = ["ME_version", "layout", "linkDiv", "selectNode"];

    const originalConsoleLog = console.log;
    console.log = function (...args) {
      if (
        !args.some(
          (arg) =>
            typeof arg === "string" &&
            blackList.some((keyword) => arg.includes(keyword))
        )
      ) {
        originalConsoleLog.apply(console, args);
      }
    };

    const originalConsoleTime = console.time;
    console.time = function (label) {
      if (!blackList.includes(label)) {
        originalConsoleTime.apply(console, arguments);
      }
    };

    const originalConsoleTimeEnd = console.timeEnd;
    console.timeEnd = function (label) {
      if (!blackList.includes(label)) {
        originalConsoleTimeEnd.apply(console, arguments);
      }
    };
  }
}

export default silenceConsole;
