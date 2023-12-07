function silenceConsole(options) {
  const blackList = options.blackList || [];

  if (typeof window !== "undefined") {
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

    const originalConsoleError = console.error;
    console.error = function (...args) {
      if (
        !args.some(
          (arg) =>
            typeof arg === "string" &&
            blackList.some((keyword) => arg.includes(keyword))
        )
      ) {
        originalConsoleError.apply(console, args);
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

  window.onerror = function (message, source, lineno, colno, error) {
    if (blackList.some((keyword) => message.includes(keyword))) {
      return true;
    }
    return false;
  };
}

export default silenceConsole;
