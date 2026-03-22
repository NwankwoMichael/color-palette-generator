import {
  addClass,
  removeClass,
  isValidColor,
  smoothScrollDebounced,
} from "../js/helper.js";

class View {
  _htmlEl = document.querySelector("html");
  _modeSwitchBtnEl = document.querySelector(".mode-toggle");
  _headerEl = document.querySelector(".header");
  _subHeaderEl = document.querySelectorAll(".sub-header");
  _inputSectionEl = document.querySelector(".input-section");
  _colorTextEl = document.getElementById("colorText");
  _generatedPalettesEl = document.querySelector(".generated-palette");
  _harmonyPalettesEl = document.querySelector(".harmony-palette-container");
  _errMsgEl = document.querySelector(".err-msg");
  _savedPalettesEl = document.querySelector(".saved-palette-container");

  //  Function for switching from night mode to daylight
  _modeToggle() {
    const modeIcon = this._modeSwitchBtnEl.querySelector("i");
    const descEl = this._generatedPalettesEl.querySelector(".desc");

    // Night mode
    if (!this._modeSwitchBtnEl.classList.contains("night")) {
      addClass("night", this._modeSwitchBtnEl, this._htmlEl);
      removeClass("daylight", this._htmlEl);

      this._subHeaderEl.forEach(
        (sub) => (sub.style.color = "var(--color-header"),
      );

      removeClass("fa-sun", modeIcon);
      addClass("fa-moon", modeIcon);

      if (descEl) descEl.style.color = "var(--color-header)";

      return;
    }

    // Daylight mode
    removeClass("night", this._htmlEl, this._modeSwitchBtnEl);
    addClass("daylight", this._htmlEl);

    this._subHeaderEl.forEach((sub) => (sub.style.color = "var(--color-dark"));

    removeClass("fa-moon", modeIcon);
    addClass("fa-sun", modeIcon);

    if (descEl) descEl.style.color = "var(--tertiary-bg-color)";

    return;
  }

  showError(el, errMsg) {
    el.textContent = "";
    el.textContent = errMsg;
    removeClass("hide", el);
    setTimeout(() => {
      addClass("hide", el);
    }, 3000);
  }

  _normalizeColor(input) {
    let normalized;
    if (input.startsWith("rgb") || input.startsWith("#")) {
      normalized = input;
    } else {
      normalized = `#${input}`;
    }

    return normalized;
  }

  // Function for updating text field to reflect currentBase
  _updateColorTextField(colorInput) {
    const colorText = this._colorTextEl;

    if (!isValidColor(colorInput)) {
      this.showError("Please enter a valid hex color");
      return;
    }

    colorText.value = colorInput || "";
  }

  _generateSwatchMarkup(palette, intensity) {
    // Base swatches
    const baseSwatch = `
    <div class="swatch-ratio-box">
    <p class="percent">Base</p>
    <div class="swatch" style="background-color:${palette.baseColor}">
    <button class="copy-btn"><i class="far fa-copy"></i></button>
    </div>
    </div>
    `;

    // Build all tint swatches
    const tintSwatches = palette.tints
      .map(
        (tint, i) => `
        <div class="swatch-ratio-box">
          <p class="percent">${(i + 1) * intensity}%</p>
          <div class="swatch" style="background-color: ${tint}">
            <button class="copy-btn"><i class="far fa-copy"></i></button>
          </div>
        </div>
      `,
      )
      .join("");

    // Build all shade swatches
    const shadeSwatches = palette.shades
      .map(
        (shade, i) => `
        <div class="swatch-ratio-box">
            <p class="percent">${(i + 1) * intensity}%</p>
            <div class="swatch" style="background-color:${shade}">
              <button class="copy-btn"><i class="far fa-copy"></i></button>
            </div>
          </div>
   `,
      )
      .join("");

    // Wrap the swatches in a single container
    return `
    <div class="swatches-container horizontal-scroll">
      <div class="swatches-row">
    ${baseSwatch}
      ${tintSwatches}
    </div>
    <div class="swatches-row">
    ${baseSwatch}
      ${shadeSwatches}
      </div>
    </div>
    `;
  }

  _generateColorPalettesMarkup(palette, intensity) {
    if (!palette) {
      console.error("Invalid palette passed to _generateColorPalettesMarkup");
      return;
    }
    return `
    <div class="palette-card" data-id="${palette.paletteId}">
        <div class="color-desc-utilities" data-base="${palette.baseColor}">
            <span class="palette-desc">${palette.name}</span>
            <span class="palette-type badge">${palette.type || "Base"}</span>
            <div class="utilities">
                <button class="modify-color-btn"><i class="fas fa-pen"></i></button>
                <button class="color-harmony"><i class="fas fa-palette"></i></button>
                <button class="favorite-btn"><i class="fas fa-plus"></i></button>
                <button class="cancel-btn"><i class="fas fa-times"></i></button>
                <span class="favorite-star ${palette.favorited ? "" : "hide"}">★</span>
            </div>
            <div class="harmony-overlay hide">
              <p class="harmony-item">Complementary</p>
              <p class="harmony-item">Analogous</p>
              <p class="harmony-item">Triadic</p>
            </div>
        </div>
        ${this._generateSwatchMarkup(palette, intensity)}
      </div>
    `;
  }

  friendlyDisplayOnEmpty() {
    this._generatedPalettesEl.innerHTML = `
      <div class="empty-state">
      <p>No palettes yet. Enter a hex color above to get started</p>
      </div>
      `;
    return;
  }

  _renderPalettes(paletteModel, showErrorOnEmpty = true) {
    // Clear the section once
    this._generatedPalettesEl.innerHTML = "";

    if (
      !paletteModel ||
      !Array.isArray(paletteModel.palettes) ||
      paletteModel.palettes.length === 0
    ) {
      // Show empty state
      this.friendlyDisplayOnEmpty();
      if (showErrorOnEmpty) {
        this.showError(this._errMsgEl, "Please enter a valid hex color");
      }
      return;
    }

    // Render only the first palette (or the last one generated)
    const lastPalette = paletteModel.palettes[paletteModel.palettes.length - 1];
    if (
      !lastPalette ||
      !lastPalette.paletteId ||
      !lastPalette.tints ||
      !lastPalette.shades
    ) {
      this.showError(this._errMsgEl, "Please enter a valid hex color");
      return;
    }

    // Insert the global section-nav once
    const sectionNavMarkup = `
    <div class="section-nav" data-id="${lastPalette.paletteId}">
      <div class="palette-ratio">
        <button class="five-percent nav-btn ${paletteModel.intensity === 5 ? "active" : ""}" data-intensity="5">5</button>
        <button class="ten-percent nav-btn ${paletteModel.intensity === 10 ? "active" : ""}" data-intensity="10">10</button>
        <button class="twenty-percent nav-btn ${paletteModel.intensity === 20 ? "active" : ""}" data-intensity="20">20</button>  
      </div>
      <button class="download-btn nav-btn"><i class="fas fa-download"></i></button>
    </div>
  `;
    this._generatedPalettesEl.insertAdjacentHTML("beforeend", sectionNavMarkup);

    // Generate and insert the lastPalette markup
    const markup = this._generateColorPalettesMarkup(
      lastPalette,
      paletteModel.intensity,
    );
    this._generatedPalettesEl.insertAdjacentHTML("beforeend", markup);

    // Smooth scroll only if valid

    const card = this._generatedPalettesEl.querySelector(
      `.palette-card[data-id="${lastPalette.paletteId}"]`,
    );
    if (card) smoothScrollDebounced(card);
  }

  _updateSwatches(palettes, intensity, containerSelector = "") {
    palettes.forEach((palette) => {
      const card = document.querySelector(
        `${containerSelector} .palette-card[data-id="${palette.paletteId}"]`,
      );
      if (!card) return;

      const swatchesContainer = card.querySelector(".swatches-container");
      if (swatchesContainer) {
        swatchesContainer.innerHTML = this._generateSwatchMarkup(
          palette,
          intensity,
        );
      }
    });

    // Update global nav active state
    const sectionNav = document.querySelector(`.section-nav`);
    if (sectionNav) {
      sectionNav
        .querySelectorAll(".palette-ration .nav-btn")
        .forEach((btnEl) => {
          btnEl.classList.remove("active");
          if (+btnEl.dataset.intensity === intensity) {
            btnEl.classList.add(".active");
          }
        });
    }
  }

  // Function for downloading palettes
  _downloadPaletteJSON(palette) {
    const dataStr = JSON.stringify(palette, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${palette.name || "palette"}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  _UpdateFavoriteIcon(paletteId, favorited) {
    const card = document.querySelector(
      `.palette-card[data-id="${paletteId}"]`,
    );
    if (!card) return;

    const star = card.querySelector(".favorite-star");
    if (!star) return;

    if (favorited) {
      removeClass("hide", star);
    } else {
      addClass("hide", star);
    }
  }

  _checkIfAllSectionEmpty(paletteModel) {
    const noGenerated =
      !paletteModel.palettes || paletteModel.palettes.length === 0;
    const noFavorites =
      !paletteModel.favorites || paletteModel.favorites.length === 0;
    const noHarmonies = paletteModel.palettes.every(
      (p) =>
        !p.harmoniesPalettes ||
        Object.values(p.harmoniesPalettes).flat().length === 0,
    );

    const nav = document.querySelector(".section-nav");
    if (noGenerated && noFavorites && noHarmonies) {
      // Hide or remove the global section nav
      if (nav) nav.remove();

      // Enable smooth scroll to the top
      smoothScrollDebounced(this._headerEl);
    } else {
      // Ensure nav exis if any section has palettes
      if (!nav) {
        const sectionNavMarkup = `
          <div class="section-nav">
            <div class="palette-ratio">
              <button class="five-percent nav-btn" data-intensity="5">5</button>
              <button class="ten-percent nav-btn" data-intensity="10">10</button> 
              <button class="twenty-percent nav-btn" data-intensity="20">20</button>
            </div>
            <button class="download-btn nav-btn"><i class="fas fa-download"></i></button>
          </div>
          `;
        this._generatedPalettesEl.insertAdjacentHTML(
          "afterend",
          sectionNavMarkup,
        );
      }
    }
  }

  _removePalette(paletteId) {
    const sectionEl = document.querySelector(".saved-palette-container");

    // Remove from generated palettes
    const palette = this._generatedPalettesEl.querySelector(
      `.palette-card[data-id="${paletteId}"]`,
    );

    if (!palette) return;
    palette.remove();

    // Remove from saved palettes
    const savedPalette = sectionEl.querySelector(
      `.palette-card[data-id="${paletteId}"]`,
    );

    if (savedPalette) {
      savedPalette.remove();
      console.log("Saved palette successfully removed");
    }
  }

  _removeHarmonyPalette(paletteId) {
    const sectionEl = document.querySelector(".harmony-palette-container");
    if (!sectionEl) return;

    const palette = document.querySelector(
      `.palette-card[data-id="${paletteId}"]`,
    );
    if (!palette) return;

    palette.remove();
  }

  _removeSavedPalette(paletteId) {
    const sectionEl = document.querySelector(".saved-palette-container");
    if (!sectionEl) return;

    const palette = sectionEl.querySelector(
      `.palette-card[data-id="${paletteId}]"`,
    );
  }

  _renderHarmony(harmonyPalettes, paletteModel) {
    // Find the correct container based on harmony type
    const sectionEl = document.querySelector(`.harmony-palette-container`);
    if (!sectionEl) return;

    // Append each harmony palette card
    harmonyPalettes.forEach((palette) => {
      // Ensure type is set to harmony if not already defined
      if (!palette.type) {
        palette.type = "Harmony";
      }

      const markup = this._generateColorPalettesMarkup(
        palette,
        paletteModel.intensity,
      );
      sectionEl.insertAdjacentHTML("afterbegin", markup);
    });

    // Smooth scroll to the last harmony
    const lastHarmony = harmonyPalettes[harmonyPalettes.length - 1];
    const card = sectionEl.querySelector(
      `.palette-card[data-id="${lastHarmony.paletteId}"]`,
    );
    if (card) smoothScrollDebounced(card);
  }

  _renderAllSavedPalettes(favorites, intensity) {
    const sectionEl = document.querySelector(".saved-palette-container");
    if (!sectionEl) return;

    // Clear before re-render
    sectionEl.innerHTML = "";

    favorites.forEach((palette) => {
      const markup = this._generateColorPalettesMarkup(
        palette,
        intensity,
        palette.type,
      );

      // Prepend so newest saved palette is om top
      sectionEl.insertAdjacentHTML("afterbegin", markup);
    });

    // Smooth scroll to the newly rendered card
    // const newestSavedPalette = favorites[0];
    const card = sectionEl.querySelector(`.palette-card`);
    if (card) smoothScrollDebounced(card);
  }

  // Event handler for night mode and daylight mode switch
  addHandlerSwitchMode() {
    this._headerEl.addEventListener("click", (e) => {
      const switchModeBtn = e.target.closest(".mode-toggle");

      if (!switchModeBtn) return;

      this._modeToggle();
    });
  }

  // Programmatically click the hidden input when the input-color__btn is clicked
  addHandlerInputColorPicker(handler) {
    // Listen for load event of the root HTML
    document.addEventListener("DOMContentLoaded", () => {
      // Initialize id,colorBtn & colorPicker
      const colorBtn = document.querySelector(".input-color__btn");
      const colorPicker = document.getElementById("colorPicker");

      // Guard clause
      if (!colorBtn || !colorPicker) return;

      // Trigger hidden input when button clicked
      colorBtn.addEventListener("click", (e) => colorPicker.click());

      // Listen for changes
      colorPicker.addEventListener("input", (e) => {
        const selectedColor = e.target.value;
        const normalized = this._normalizeColor(selectedColor);

        // Picker always returns a valid hex, but guard anyway
        if (!isValidColor(normalized)) return;

        // Pass normalized color to controller
        handler(normalized);

        // Hide colorPicker after selection
        colorPicker.blur();
        colorPicker.style.display = "none";
      });
    });
  }

  // Function for obtaining user's input
  addHandlerGetUserInputViaColorText(handler) {
    this._colorTextEl.addEventListener("input", (e) => {
      // Initialize colorText input
      const rawInput = e.target.value.trim();
      const normalized = this._normalizeColor(rawInput);

      // Only call handlrt if normalized string is a valid color
      if (!isValidColor(normalized)) return;

      handler(normalized);
    });
  }

  // Handle when generateBtn is clicked
  addHandlerGenerateBtnClicked(handler) {
    this._inputSectionEl.addEventListener("click", (e) => {
      // Initialize genrateBtn
      const generateBtn = e.target.closest(".generate-btn");
      if (!generateBtn) return;

      handler();
    });
  }

  // Handle intensity buttons
  addHandlerIntensityDownloadBtns(handler) {
    this._generatedPalettesEl.addEventListener("click", (e) => {
      const clickedBtn = e.target.closest(".nav-btn");
      if (!clickedBtn) return;

      const isDownload = clickedBtn.classList.contains("download-btn");

      if (isDownload) {
        // Pass the palete id to the handler for download logic
        const paletteId = clickedBtn.closest(".section-nav").dataset.id;
        handler(paletteId, "download");
        return;
      }

      // Remove active class from all intensity buttons
      const sectionNav = clickedBtn.closest(".section-nav");
      sectionNav.querySelectorAll(".palette-ratio .nav-btn").forEach((btnEl) =>
        //  Remove active class from btns
        removeClass("active", btnEl),
      );

      // Add active to the clicked intensity btn
      addClass("active", clickedBtn);

      // Get intensity value from dataset
      const btn = +clickedBtn.dataset.intensity;

      handler(null, btn);
    });
  }

  addHandlerEdit(handler) {
    const picker = document.getElementById("colorPicker");

    // Delegate clicks from any section that has a modify-color-btn
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest(".modify-color-btn");
      if (!btn) return;

      const card = btn.closest(".palette-card");
      if (!card) return;

      const id = card.dataset.id;
      const baseColor = card.querySelector(".color-desc-utilities").dataset
        .base;

      // Pre-fill with current base color
      picker.value = baseColor;
      picker.click();

      // One-time listener
      const onInput = () => {
        handler(id, picker.value);
        picker.removeEventListener("input", onInput);
      };

      picker.addEventListener("input", onInput);
    });
  }

  // Display harmony overlay
  addHandlerHarmonyOverlay(handler) {
    // Delegate from the whole document so all sections are covered
    document.body.addEventListener("click", (e) => {
      const harmonyBtn = e.target.closest(".color-harmony");
      if (!harmonyBtn) return;

      const card = harmonyBtn.closest(".palette-card");

      if (!card) return;

      const harmonyOverlay = card.querySelector(".harmony-overlay");
      if (!harmonyOverlay) return;

      // display overlay
      removeClass("hide", harmonyOverlay);

      // Listen for clicks on harmony items inside this overlay
      const onItemClick = (event) => {
        const item = event.target.closest(".harmony-item");
        if (!item) return;

        const id = card.dataset.id;
        const type = item.textContent.toLowerCase();

        handler(id, type);

        // Hide overlay after selection
        addClass("hide", harmonyOverlay);

        // Clean up listener so it doesn't stack
        harmonyOverlay.removeEventListener("click", onItemClick);
      };

      harmonyOverlay.addEventListener("click", onItemClick);
    });
  }

  addHandlerHideHarmonyOverlay() {
    document.querySelector("body").addEventListener("click", (e) => {
      //  if click is inside an overlay or on the palette btn, ignore
      if (
        e.target.closest(".harmony-overlay") ||
        e.target.closest(".color-harmony")
      )
        return;

      // Hide all overlays
      document
        .querySelectorAll(".harmony-overlay")
        .forEach((overlay) => addClass("hide", overlay));
    });
  }

  addHandlerHideHarmonyOverlayEsc() {
    document.querySelector("body").addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document
          .querySelectorAll(".harmony-overlay")
          .forEach((overlay) => addClass("hide", overlay));
      }
    });
  }

  addHandlerFavorite(handler) {
    // Generated palettes
    this._generatedPalettesEl.addEventListener("click", (e) => {
      const favIcon = e.target.closest(".favorite-btn");
      if (!favIcon) return;

      const paletteCard = favIcon.closest(`.palette-card`);
      const paletteId = paletteCard.dataset.id;

      // Find the star within this card
      const star = paletteCard.querySelector(".favorite-star");
      if (star) {
        star.classList.toggle("hide");
      }
      handler(paletteId);
    });

    // Harmony palettes
    this._harmonyPalettesEl.addEventListener("click", (e) => {
      const favIcon = e.target.closest(".favorite-btn");
      if (!favIcon) return;
      const paletteCard = favIcon.closest(".palette-card");
      const paletteId = paletteCard.dataset.id;

      // Find the star within this card
      const star = paletteCard.querySelector(".favorite-star");
      if (star) {
        star.classList.toggle("hide");
      }
      handler(paletteId);
    });
  }

  addHandlerDelete(handler) {
    document.body.addEventListener("click", (e) => {
      // Initialize delete icon
      const btn = e.target.closest(".cancel-btn");
      if (!btn) return;

      // Obtain the palette card id
      const id = btn.closest(".palette-card").dataset.id;

      // Clear color input field
      this._colorTextEl.value = "";
      handler(id);
    });
  }

  addHandlerPageReload(handler) {
    window.addEventListener("DOMContentLoaded", handler);
  }

  _addHandlerResetApp(handler) {
    document.getElementById("reset-app-btn").addEventListener("click", () => {
      const confirmed = window.confirm(
        "Are you sure you want to reset the app? This will delete all saved palettes.",
      );

      if (!confirmed) return;

      handler();

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

export default new View();
