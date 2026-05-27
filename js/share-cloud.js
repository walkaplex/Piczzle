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

  function apiUrl(path) {
    return `${config.supabaseUrl.replace(/\/$/, "")}${path}`;
  }

  function headers(extra) {
    return {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
      ...extra
    };
  }

  async function savePuzzle(data) {
    if (!isReady()) return null;

    const response = await fetch(apiUrl("/rest/v1/shared_puzzles"), {
      method: "POST",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify({
        id: data.id,
        image: data.image,
        size: data.size
      })
    });

    if (!response.ok) {
      throw new Error(`Share upload failed: ${response.status}`);
    }

    const rows = await response.json();
    return rows && rows[0] ? rows[0] : data;
  }

  async function loadPuzzle(id) {
    if (!isReady()) return null;

    const response = await fetch(
      apiUrl(`/rest/v1/shared_puzzles?id=eq.${encodeURIComponent(id)}&select=id,image,size,created_at&limit=1`),
      { headers: headers() }
    );

    if (!response.ok) {
      throw new Error(`Share download failed: ${response.status}`);
    }

    const rows = await response.json();
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
