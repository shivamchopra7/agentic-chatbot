/**
 * Web Search Integration using SerpAPI or similar
 * 
 * For production, you'd use services like:
 * - SerpAPI (https://serpapi.com)
 * - Serper (https://serper.dev)
 * - Brave Search API
 * - Tavily (AI-native search)
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  error?: string;
}

/**
 * Search the web using a search API
 * Configure SERP_API_KEY or SERPER_API_KEY in your environment
 */
export async function searchWeb(
  query: string,
  numResults = 5
): Promise<WebSearchResponse> {
  // Try Serper API first (simpler and cheaper)
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    return searchWithSerper(query, numResults, serperKey);
  }

  // Fall back to SerpAPI
  const serpApiKey = process.env.SERP_API_KEY;
  if (serpApiKey) {
    return searchWithSerpApi(query, numResults, serpApiKey);
  }

  // No API key configured - return empty results
  return {
    query,
    results: [],
    error: "No search API configured. Add SERPER_API_KEY or SERP_API_KEY to enable web search.",
  };
}

async function searchWithSerper(
  query: string,
  numResults: number,
  apiKey: string
): Promise<WebSearchResponse> {
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: numResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = (data.organic || []).map(
      (item: { title: string; link: string; snippet?: string }, index: number) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
        position: index + 1,
      })
    );

    return { query, results };
  } catch (error) {
    return {
      query,
      results: [],
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

async function searchWithSerpApi(
  query: string,
  numResults: number,
  apiKey: string
): Promise<WebSearchResponse> {
  try {
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      num: numResults.toString(),
      engine: "google",
    });

    const response = await fetch(
      `https://serpapi.com/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = (data.organic_results || []).map(
      (item: { title: string; link: string; snippet?: string }, index: number) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
        position: index + 1,
      })
    );

    return { query, results };
  } catch (error) {
    return {
      query,
      results: [],
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

/**
 * Format search results for inclusion in AI context
 */
export function formatSearchResultsForContext(
  results: SearchResult[]
): string {
  if (results.length === 0) {
    return "No web search results found.";
  }

  return results
    .map(
      (r) =>
        `[${r.position}] ${r.title}\nURL: ${r.url}\n${r.snippet}`
    )
    .join("\n\n");
}

