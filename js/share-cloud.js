(() => {
  const config = window.PiczzleShareConfig || {};

  function isReady() {
    return Boolean(
      config.enabled &&
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      !config.supabaseUrl.includes("YOUR-PROJECT") &&
      !config.supabaseAnonKey.includes("YOUR-SUPABASE")
    );
  }

  function baseUrl() {
    return config.supabaseUrl
      .replace(/\/$/, "")
      .replace(/\/rest\/v1$/, "");
  }

  function apiUrl(path) {
    return `${baseUrl()}${path}`;
  }

  function headers(extra) {
    return {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
      ...extra
    };
  }

  async function request(path, options, readJson = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(apiUrl(path), { ...options, signal: controller.signal });
      if (!readJson) return response;
      // Keep the deadline active while the image payload is still downloading.
      const data = await response.json().catch(error => {
        if (response.ok || error.name === "AbortError") throw error;
        return null;
      });
      return { ok: response.ok, status: response.status, data };
    } finally {
      clearTimeout(timer);
    }
  }

  async function savePuzzle(data) {
    if (!isReady()) return null;

    const response = await request("/rest/v1/shared_puzzles", {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        id: data.id,
        image: data.image,
        size: data.size
      })
    });

    if (!response.ok) {
      throw new Error(`Share upload failed: ${response.status}`);
    }

    return data;
  }

  async function loadPuzzle(id) {
    if (!isReady()) return null;

    let response = await request("/rest/v1/rpc/get_shared_puzzle", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ puzzle_id: id })
    }, true);
    // Transitional compatibility until the new reader is installed in Supabase.
    if (response.status === 404) {
      const error = response.data || {};
      if (error.code === "PGRST202") {
        response = await request(
          `/rest/v1/shared_puzzles?id=eq.${encodeURIComponent(id)}&select=id,image,size,created_at&limit=1`,
          { headers: headers() }, true
        );
      }
    }

    if (!response.ok) {
      throw new Error(`Share download failed: ${response.status}`);
    }

    const rows = response.data;
    return rows && rows[0] ? rows[0] : null;
  }

  function publicLink(id) {
    const base = config.publicBaseUrl || `${location.origin}${location.pathname}`;
    const url = new URL(base, location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("puzzle", id);
    return url.toString();
  }

  window.PiczzleShareCloud = {
    isReady,
    savePuzzle,
    loadPuzzle,
    publicLink
  };
})();
