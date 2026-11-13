import { formatShortDate } from "./relative-date";

const now = new Date(2026, 10, 13, 12, 0, 0);
const before = (ms: number) => new Date(now.getTime() - ms);

describe("formatShortDate", () => {
  it("uses relative wording within a week", () => {
    expect(formatShortDate(before(20_000), now)).toBe("just now");
    expect(formatShortDate(before(5 * 60_000), now)).toBe("5 minutes ago");
    expect(formatShortDate(before(3 * 3_600_000), now)).toBe("3 hours ago");
    expect(formatShortDate(before(24 * 3_600_000), now)).toBe("yesterday");
    expect(formatShortDate(before(6 * 24 * 3_600_000), now)).toBe("6 days ago");
  });

  it("falls back to a plain date after a week or for future timestamps", () => {
    expect(formatShortDate(before(7 * 24 * 3_600_000), now)).toBe("Nov 6, 2026");
    expect(formatShortDate(new Date(2026, 10, 20, 9, 0, 0), now)).toBe("Nov 20, 2026");
  });
});
