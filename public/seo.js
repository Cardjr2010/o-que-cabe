(function () {
  const state = {
    measurementId: "",
    ready: false,
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.async = true;
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  function normalizeEventParams(params) {
    return Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== ""),
    );
  }

  async function initAnalytics() {
    try {
      const response = await fetch("/api/seo/config", { credentials: "same-origin" });
      const config = await response.json();
      const measurementId = String(config?.analytics?.measurementId || "").trim();
      if (!measurementId) return;

      state.measurementId = measurementId;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };

      await loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        page_title: document.title,
        page_location: window.location.href,
      });
      state.ready = true;
    } catch {
      state.ready = false;
    }
  }

  window.oqcTrack = function oqcTrack(eventName, params) {
    if (!state.ready || typeof window.gtag !== "function") return;
    window.gtag("event", eventName, normalizeEventParams(params));
  };

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "searchForm") return;

    const query = document.querySelector("#productInput")?.value || "";
    const monthly = document.querySelector("#monthlyInput")?.value || "";
    const totalBudget = document.querySelector("#totalBudgetInput")?.value || "";
    const months = document.querySelector("#monthsInput")?.value || "";

    window.oqcTrack("oqc_search", {
      query,
      monthly_budget: monthly,
      total_budget: totalBudget,
      installments: months,
      page_path: window.location.pathname,
    });
  }, true);

  document.addEventListener("click", (event) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor) return;

    const href = anchor.getAttribute("href") || "";
    if (!href) return;

    const isOutbound = /^https?:\/\//i.test(href);
    if (isOutbound) {
      window.oqcTrack("oqc_outbound_click", {
        destination: href,
        label: anchor.textContent?.trim() || "",
        page_path: window.location.pathname,
      });
      return;
    }

    if (href.startsWith("/blog/")) {
      window.oqcTrack("oqc_blog_click", {
        destination: href,
        label: anchor.textContent?.trim() || "",
      });
      return;
    }

    if (href.includes("?q=")) {
      window.oqcTrack("oqc_ready_search_click", {
        destination: href,
        label: anchor.textContent?.trim() || "",
      });
    }
  }, true);

  initAnalytics();
}());
