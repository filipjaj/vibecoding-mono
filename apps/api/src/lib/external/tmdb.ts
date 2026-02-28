type TmdbResult = {
  externalId: string;
  title: string;
  authorOrDirector: string | null;
  coverUrl: string | null;
  year: number | null;
  description: string | null;
};

export async function searchFilms(query: string, apiKey: string): Promise<TmdbResult[]> {
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results: Array<{
      id: number; title: string; release_date?: string;
      poster_path?: string; overview?: string;
    }>;
  };

  return data.results.map((movie) => ({
    externalId: `tmdb:${movie.id}`,
    title: movie.title,
    authorOrDirector: null,
    coverUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
    year: movie.release_date ? parseInt(movie.release_date.slice(0, 4), 10) : null,
    description: movie.overview ?? null,
  }));
}
