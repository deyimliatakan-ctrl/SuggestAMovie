import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function App() {
  const API_KEY = "9aa54f10485a9f3e7ec99b660519cadf";
  const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ genres: [], yearStart: "", yearEnd: "", rating: "", runtime: "" });
  const [genres, setGenres] = useState([]);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const isMounted = useRef(true);

  useEffect(() => {
    fetchGenres();
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function fetchGenres() {
    const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const data = await res.json();
    setGenres(data.genres || []);
  }

  async function getRandomMovie() {
    if (isMounted.current) {
      setLoading(true);
      setError(null);
      setMovie(null);
      setCredits({ cast: [], crew: [] });
    }

    try {
      let query = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&include_adult=false&include_video=false&sort_by=popularity.desc`;

      if (filters.genres.length > 0) query += `&with_genres=${filters.genres.join(',')}`;
      if (filters.yearStart) query += `&primary_release_date.gte=${filters.yearStart}-01-01`;
      if (filters.yearEnd) query += `&primary_release_date.lte=${filters.yearEnd}-12-31`;
      if (filters.rating) query += `&vote_average.gte=${filters.rating}`;
      if (filters.runtime) query += `&with_runtime.lte=${filters.runtime}`;

      const page = Math.floor(Math.random() * 10) + 1;
      query += `&page=${page}`;

      const res = await fetch(query);
      if (!res.ok) throw new Error("Failed to fetch data from TMDb.");
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      if (results.length === 0) throw new Error("No movie found with selected filters.");

      const candidate = results[Math.floor(Math.random() * results.length)];
      if (!candidate || !candidate.id) throw new Error("Invalid movie data.");

      const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${candidate.id}?api_key=${API_KEY}&language=en-US`);
      const details = detailRes.ok ? await detailRes.json() : candidate;

      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${candidate.id}/credits?api_key=${API_KEY}&language=en-US`);
      const creditData = creditsRes.ok ? await creditsRes.json() : { cast: [], crew: [] };

      if (isMounted.current) {
        setMovie(details);
        setCredits({ cast: creditData.cast || [], crew: creditData.crew || [] });
      }
    } catch (err) {
      if (isMounted.current) setError(err?.message || "Unknown error occurred.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  const toggleGenre = (genreId) => {
    setFilters((prev) => {
      const alreadySelected = prev.genres.includes(genreId);
      return {
        ...prev,
        genres: alreadySelected ? prev.genres.filter((id) => id !== genreId) : [...prev.genres, genreId],
      };
    });
  };

  const director = credits.crew.find((p) => p.job === "Director");
  const topCast = credits.cast.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white flex items-center justify-center p-6">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold mb-2">Suggest A Movie</h1>
          <p className="text-sm text-gray-600 mb-4">Filter by multiple genres, year range, rating, or runtime.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="col-span-2">
              <div className="flex flex-wrap gap-2 border rounded-lg p-2 h-32 overflow-y-auto">
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`px-2 py-1 rounded-md text-sm border ${filters.genres.includes(g.id) ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <input type="number" placeholder="Start Year" className="border rounded-lg p-2" value={filters.yearStart} onChange={(e) => setFilters({ ...filters, yearStart: e.target.value })} />

            <input type="number" placeholder="End Year" className="border rounded-lg p-2" value={filters.yearEnd} onChange={(e) => setFilters({ ...filters, yearEnd: e.target.value })} />

            <input type="number" placeholder="Min Rating (0-10)" className="border rounded-lg p-2" value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: e.target.value })} />

            <input type="number" placeholder="Max Runtime (min)" className="border rounded-lg p-2" value={filters.runtime} onChange={(e) => setFilters({ ...filters, runtime: e.target.value })} />
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={getRandomMovie}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Loading..." : "🎬 Suggest A Movie"}
            </button>

            <button
              onClick={() => {
                if (isMounted.current) {
                  setMovie(null);
                  setError(null);
                  setFilters({ genres: [], yearStart: "", yearEnd: "", rating: "", runtime: "" });
                  setCredits({ cast: [], crew: [] });
                }
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Clear
            </button>
          </div>

          {error && <div className="mb-4 text-red-600">Error: {error}</div>}

          {movie ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h2 className="text-xl font-semibold">
                {movie.title} {movie.release_date ? `(${movie.release_date.slice(0, 4)})` : ""}
              </h2>
              <div className="text-sm text-gray-600">Genres: {Array.isArray(movie.genres) ? movie.genres.map((g) => g.name).join(", ") : '—'}</div>
              {director && <div className="text-sm text-gray-600">Director: {director.name}</div>}
              {topCast.length > 0 && <div className="text-sm text-gray-600">Cast: {topCast.map((a) => a.name).join(", ")}</div>}
              <p className="text-gray-700">{movie.overview || 'No description available.'}</p>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">TMDb Rating: {movie.vote_average ?? '—'} ({movie.vote_count ?? 0} votes)</div>
                <button onClick={() => getRandomMovie()} className="px-3 py-1 bg-gray-100 rounded-md text-sm">
                  Show Another Movie
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-gray-500">No movie selected yet. Choose filters and click the button!</div>
          )}
        </div>

        <aside className="flex flex-col items-center">
          {movie && movie.poster_path ? (
            <img src={`${IMAGE_BASE}${movie.poster_path}`} alt={movie.title} className="rounded-xl shadow-lg w-full mb-4" />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">No Poster</div>
          )}

          <div className="text-xs text-gray-500 text-center">This product uses the TMDb API but is not endorsed or certified by TMDb.</div>
        </aside>
      </div>
    </div>
  );
}
