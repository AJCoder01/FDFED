import { minor, fees } from "./finance.service";
describe("integer money", () => {
  test.each([
    [799, 79900],
    [0.01, 1],
    ["1299.99", 129999],
  ])("converts %s INR to paise", (value, expected) =>
    expect(minor(value)).toBe(expected),
  );
  test.each([-1, NaN, Infinity, 1.001, "1e4", "-10", "20000001"])(
    "rejects invalid amount %s",
    (value) => expect(() => minor(value)).toThrow(),
  );
  test("5% fee rounds once in paise and payout balances", () => {
    expect(fees(79900)).toEqual({ feeMinor: 3995, payoutMinor: 75905 });
    expect(fees(1)).toEqual({ feeMinor: 0, payoutMinor: 1 });
    expect(fees(0)).toEqual({ feeMinor: 0, payoutMinor: 0 });
  });
});
