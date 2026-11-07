// Display helper for seeded order history. The confirmation workflow does not calculate prices.
export function inr(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}`;
}
