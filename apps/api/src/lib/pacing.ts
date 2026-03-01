export type PacingData = {
  currentPage: number;
  totalPages: number;
  pagesRemaining: number;
  daysRemaining: number;
  pagesPerDay: number;
  aheadBehindDays: number;
};

export function calculatePacing(
  currentPage: number,
  totalPages: number,
  eventDate: Date,
  roundStartDate: Date,
): PacingData | null {
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((eventDate.getTime() - roundStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - roundStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const pagesRemaining = Math.max(0, totalPages - currentPage);

  if (daysRemaining === 0) {
    return { currentPage, totalPages, pagesRemaining, daysRemaining: 0, pagesPerDay: pagesRemaining, aheadBehindDays: 0 };
  }

  const pagesPerDay = Math.ceil(pagesRemaining / daysRemaining);
  const expectedPage = Math.round((daysElapsed / totalDays) * totalPages);
  const pageDiff = currentPage - expectedPage;
  const dailyRate = totalPages / totalDays;
  const aheadBehindDays = dailyRate > 0 ? Math.round(pageDiff / dailyRate) : 0;

  return { currentPage, totalPages, pagesRemaining, daysRemaining, pagesPerDay, aheadBehindDays };
}
