(() => {
  const root = document.documentElement;
  const themeKey = "integra-pcd-theme";
  const scaleKey = "integra-pcd-scale";
  const readingKey = "integra-pcd-reading";
  const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const navIcons = {
    "index.html": "🏠",
    "fluxo.html": "🧭",
    "cartilha.html": "📘",
    "portal.html": "💻",
    "app.html": "📱",
    "central.html": "🎛️"
  };

  function announce(message) {
    let region = document.querySelector("[data-live-region]");
    if (!region) {
      region = document.createElement("div");
      region.className = "sr-only";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("data-live-region", "true");
      document.body.appendChild(region);
    }

    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = message;
    }, 30);
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(themeKey, theme);
    document.querySelectorAll("[data-action='toggle-contrast']").forEach((button) => {
      button.classList.toggle("is-active", theme === "contrast");
      button.setAttribute("aria-pressed", String(theme === "contrast"));
    });
  }

  function applyReading(enabled) {
    root.setAttribute("data-reading", enabled ? "simple" : "default");
    localStorage.setItem(readingKey, enabled ? "simple" : "default");
    document.querySelectorAll("[data-action='toggle-reading']").forEach((button) => {
      button.classList.toggle("is-active", enabled);
      button.setAttribute("aria-pressed", String(enabled));
    });
  }

  function applyScale(scale) {
    const bounded = Math.max(90, Math.min(120, scale));
    root.style.setProperty("--font-scale", `${bounded}%`);
    localStorage.setItem(scaleKey, String(bounded));
    const readout = document.querySelector("[data-font-readout]");
    if (readout) {
      readout.textContent = `${bounded}%`;
    }
  }

  function currentTheme() {
    return localStorage.getItem(themeKey) || "default";
  }

  function currentScale() {
    return Number(localStorage.getItem(scaleKey) || 100);
  }

  function currentReading() {
    return localStorage.getItem(readingKey) === "simple";
  }

  function updateSpeakButtons(isSpeaking) {
    document.querySelectorAll("[data-action='speak-page']").forEach((button) => {
      button.classList.toggle("is-speaking", isSpeaking);
      button.setAttribute("aria-pressed", String(isSpeaking));
      button.innerHTML = isSpeaking
        ? "<span aria-hidden='true'>⏹️</span><span>Parar áudio</span>"
        : "<span aria-hidden='true'>🔊</span><span>Ouvir página</span>";
    });
  }

  function sanitizeSpeechText(text) {
    return text
      .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]+/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getReadableText() {
    const main = document.querySelector("main");
    if (!main) {
      return sanitizeSpeechText(document.body.textContent);
    }

    const clone = main.cloneNode(true);
    clone.querySelectorAll("nav, .assist-strip, script, style").forEach((node) => node.remove());
    return sanitizeSpeechText(clone.textContent);
  }

  function toggleSpeech() {
    if (!speechSupported) {
      announce("Este navegador não suporta leitura em voz alta.");
      return;
    }

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      updateSpeakButtons(false);
      announce("Leitura em voz alta interrompida.");
      return;
    }

    const text = getReadableText();
    if (!text) {
      announce("Não encontrei conteúdo para ler nesta página.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => {
      updateSpeakButtons(true);
      announce("Leitura em voz alta iniciada.");
    };
    utterance.onend = () => {
      updateSpeakButtons(false);
      announce("Leitura em voz alta finalizada.");
    };
    utterance.onerror = () => {
      updateSpeakButtons(false);
      announce("Não foi possível reproduzir a leitura em voz alta.");
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function injectAssistStrip() {
    const nav = document.querySelector(".main-nav");
    if (!nav || document.querySelector(".assist-strip")) {
      return;
    }

    const strip = document.createElement("section");
    strip.className = "assist-strip";
    strip.setAttribute("aria-label", "Ajuda rápida de acessibilidade");
    strip.innerHTML = `
      <article class="assist-card">
        <span class="assist-icon" aria-hidden="true">🔊</span>
        <div>
          <strong>Ouvir a página</strong>
          <p>Use o botão de áudio no topo se ler estiver difícil.</p>
        </div>
      </article>
      <article class="assist-card">
        <span class="assist-icon" aria-hidden="true">🙂</span>
        <div>
          <strong>Leitura fácil</strong>
          <p>Ative a leitura fácil para aumentar espaço e deixar o texto mais leve.</p>
        </div>
      </article>
      <article class="assist-card">
        <span class="assist-icon" aria-hidden="true">🟡✅⚠️</span>
        <div>
          <strong>Status claros</strong>
          <p>Os avisos usam palavra, ícone e cor ao mesmo tempo.</p>
        </div>
      </article>
    `;
    nav.insertAdjacentElement("afterend", strip);
  }

  function enhanceNavIcons() {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.querySelector(".icon-label")) {
        return;
      }

      const href = link.getAttribute("href");
      const label = link.textContent.trim();
      const icon = navIcons[href] || "➡️";
      link.innerHTML = `<span class="icon-label"><span aria-hidden="true">${icon}</span><span>${label}</span></span>`;
    });
  }

  applyTheme(currentTheme());
  applyReading(currentReading());
  applyScale(currentScale());
  injectAssistStrip();
  enhanceNavIcons();

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-action");

      if (action === "toggle-contrast") {
        applyTheme(currentTheme() === "contrast" ? "default" : "contrast");
      }

      if (action === "toggle-reading") {
        applyReading(!currentReading());
      }

      if (action === "font-up") {
        applyScale(currentScale() + 5);
      }

      if (action === "font-down") {
        applyScale(currentScale() - 5);
      }

      if (action === "font-reset") {
        applyScale(100);
      }

      if (action === "speak-page") {
        toggleSpeech();
      }
    });
  });

  if (!speechSupported) {
    document.querySelectorAll("[data-action='speak-page']").forEach((button) => {
      button.disabled = true;
      button.innerHTML = "<span aria-hidden='true'>🔇</span><span>Áudio indisponível</span>";
      button.setAttribute("aria-disabled", "true");
    });
  } else {
    updateSpeakButtons(false);
  }

  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === page) {
      link.classList.add("current");
      link.setAttribute("aria-current", "page");
    }
  });

  window.addEventListener("pagehide", () => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
  });
})();
