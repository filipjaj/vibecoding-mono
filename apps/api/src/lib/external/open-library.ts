type OpenLibraryResult = {
  externalId: string;
  title: string;
  authorOrDirector: string | null;
  coverUrl: string | null;
  year: number | null;
  description: string | null;
};

export async function searchBooks(query: string): Promise<OpenLibraryResult[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    docs: Array<{
      key: string; title: string; author_name?: string[];
      first_publish_year?: number; cover_i?: number;
    }>;
  };

  return data.docs.map((doc) => ({
    externalId: doc.key,
    title: doc.title,
    authorOrDirector: doc.author_name?.[0] ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    year: doc.first_publish_year ?? null,
    description: null,
  }));
}
