export function formatApprovedReviewCount(count: number | null | undefined) {
  const numericCount = Number(count ?? 0)
  const safeCount = Number.isFinite(numericCount) ? Math.max(0, Math.trunc(numericCount)) : 0
  return `${safeCount} approved review${safeCount === 1 ? '' : 's'}`
}
