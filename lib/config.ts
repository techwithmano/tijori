export const FRIEND_FEE_PCT = 5; // friend-approved early release
export const SOLO_FEE_PCT = 15; // emergency self-break (the correct number)
export const FRIEND_RETURN_PCT = 100 - FRIEND_FEE_PCT; // 95
export const SOLO_RETURN_PCT = 100 - SOLO_FEE_PCT; // 85

// Helper to compute integer fils and KWD amounts accurately
export function calculateFriendRelease(amount: number) {
  const amountFils = Math.round(amount * 1000);
  const feeFils = Math.round((amountFils * FRIEND_FEE_PCT) / 100);
  const returnFils = amountFils - feeFils;
  return {
    fee: feeFils / 1000,
    returnAmount: returnFils / 1000,
    feePct: FRIEND_FEE_PCT,
    returnPct: FRIEND_RETURN_PCT,
  };
}

export function calculateSoloBreak(amount: number) {
  const amountFils = Math.round(amount * 1000);
  const feeFils = Math.round((amountFils * SOLO_FEE_PCT) / 100);
  const returnFils = amountFils - feeFils;
  return {
    fee: feeFils / 1000,
    returnAmount: returnFils / 1000,
    feePct: SOLO_FEE_PCT,
    returnPct: SOLO_RETURN_PCT,
  };
}
