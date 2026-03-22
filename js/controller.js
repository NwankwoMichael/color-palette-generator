import * as model from "./model.js";
import view from "./views.js";
import { isValidColor } from "./helper.js";

// Handle color input (Via text or color picker)
const controlColorInput = (colorInput) => {
  if (!isValidColor(colorInput)) {
    view.showError("Invalid color format");
    return;
  }

  // Just store the base color, no generation yet
  const newPalette = model.createNewPalette(colorInput);
  model.paletteModel.palettes.push(newPalette);

  // Update the input field display
  view._updateColorTextField(colorInput);

  // Persist data
  model.persistPaletteModel();
};

// Handle Generate button click
const controlGeneratePalette = function () {
  const input = view._colorTextEl.value.trim();

  // Validate first
  if (!input || !isValidColor(input)) {
    view.showError(view._errMsgEl, "Please enter a valid hex color");
    return;
  }

  // Normalize and update model
  const normalized = view._normalizeColor(input);

  // Create new palette if none exist yet
  if (model.paletteModel.palettes.length === 0) {
    const newPalette = model.createNewPalette(normalized);
    model.paletteModel.palettes.push(newPalette);
  } else {
    // Update the last palette's base color
    const lastPalette =
      model.paletteModel.palettes[model.paletteModel.palettes.length - 1];
    lastPalette.baseColor = normalized;
  }

  // Generate tints/shades for all palettes
  model.paletteModel.palettes.forEach((palette) => {
    const { tints, shades } = model.generateTintsShades(
      palette.baseColor,
      model.paletteModel.intensity,
    );
    palette.tints = tints;
    palette.shades = shades;
  });

  // Render all palettes
  view._renderPalettes(model.paletteModel);

  // check if all sections are empty
  view._checkIfAllSectionEmpty(model.paletteModel);

  // Persist data
  model.persistPaletteModel();
};

// Handle intensity button (5%, 10%, 20%) & Download click
const controlIntensityChangeAndDownload = function (paletteId, value) {
  if (typeof value === "string" && value === "download") {
    view._downloadPaletteJSON(model.paletteModel);
    return;
  }

  if (!Number.isFinite(value)) return;

  if (model.paletteModel.palettes?.length === 0) return;

  //Update global intensity
  model.paletteModel.intensity = value;

  // Update generated palettes
  model.paletteModel.palettes.forEach((palette) => {
    const { tints, shades } = model.generateTintsShades(
      palette.baseColor,
      value,
    );
    palette.tints = tints;
    palette.shades = shades;

    // Update harmony palettes inside each base palette
    if (palette.harmoniesPalettes) {
      Object.values(palette.harmoniesPalettes)
        .flat()
        .forEach((harmony) => {
          const { tints, shades } = model.generateTintsShades(
            harmony.baseColor,
            value,
          );
          harmony.tints = tints;
          harmony.shades = shades;
        });
    }
  });

  // Updates favorites
  model.paletteModel.favorites.forEach((palette) => {
    const { tints, shades } = model.generateTintsShades(
      palette.baseColor,
      value,
    );
    palette.tints = tints;
    palette.shades = shades;
  });

  // Refresh swatches
  view._updateSwatches(model.paletteModel.palettes, value);

  model.paletteModel.palettes.forEach((p) => {
    if (p.harmoniesPalettes) {
      Object.entries(p.harmoniesPalettes).forEach(([type, harmonies]) => {
        view._updateSwatches(harmonies, value);
      });
    }
  });
  view._updateSwatches(
    model.paletteModel.favorites,
    value,
    ".saved-palette-container",
  );

  // Persist data
  model.persistPaletteModel();
};

// Handle edits color via color picker
const controlEditColor = function (paletteId, newColor) {
  const palette = model.findPaletteById(model.paletteModel, paletteId);
  if (!palette) return;

  //Update base color to new color
  palette.baseColor = newColor;

  // Recalculate tints and shades for the edited palette
  const { tints, shades } = model.generateTintsShades(
    newColor,
    model.paletteModel.intensity,
  );
  palette.tints = tints;
  palette.shades = shades;

  // Propagate to favorites if this palette is saved
  const savedPalette = model.paletteModel.favorites.find(
    (p) => p.paletteId === paletteId,
  );
  if (savedPalette) {
    savedPalette.baseColor = newColor;
    savedPalette.tints = tints;
    savedPalette.shades = shades;
    view._updateSwatches(
      [savedPalette],
      model.paletteModel.intensity,
      ".saved-palette-container",
    );
  }

  // If it's a base palette, re-render generated section + harmonies
  const basePalette = model.paletteModel.palettes.find(
    (p) => p.paletteId === paletteId,
  );
  if (basePalette) {
    view._updateSwatches([basePalette], model.paletteModel.intensity);

    // update harmonies tied to this palette
    if (basePalette.harmoniesPalettes) {
      const harmonies = Object.values(basePalette.harmoniesPalettes).flat();
      harmonies.forEach((harmony) => {
        const { tints, shades } = model.generateTintsShades(
          harmony.baseColor,
          model.paletteModel.intensity,
        );
        harmony.tints = tints;
        harmony.shades = shades;
      });
      view._updateSwatches(harmonies, model.paletteModel.intensity);
    }
  }

  // If it's a harmony palette, update just that card
  for (const base of model.paletteModel.palettes) {
    if (base.harmoniesPalettes) {
      const harmonies = Object.values(base.harmoniesPalettes).flat();
      const harmony = harmonies.find((h) => h.paletteId === paletteId);

      if (harmony) {
        view._updateSwatches([harmony], model.paletteModel.intensity);
      }
    }
  }

  // Persist data
  model.persistPaletteModel();
};

// Handle harmony type select (complementary, analogous, triadic)
const controlHarmony = function (paletteId, type) {
  const harmonyPalettes = model.generateHarmonyPaletteDelegation(
    model.paletteModel,
    paletteId,
    type,
  );
  if (!harmonyPalettes || harmonyPalettes.length === 0) return;

  // Pass to view for rendering
  view._renderHarmony(harmonyPalettes, model.paletteModel);

  // Persist data
  model.persistPaletteModel();
};

// Handle favorite icon click
const controlToggleFavorite = function (paletteId) {
  //  Fimd palette by ID
  const palette = model.findPaletteById(model.paletteModel, paletteId);
  if (!palette) return;

  palette.favorited = !palette.favorited;

  if (palette.favorited) {
    if (!model.paletteModel.favorites.some((p) => p, paletteId)) {
      model.paletteModel.favorites.push(palette);
    }
  } else {
    model.paletteModel.favorites = model.paletteModel.favorites.filter(
      (p) => p.paletteId !== paletteId,
    );
  }
  // Update inline star in the original card
  view._UpdateFavoriteIcon(paletteId, palette.favorited);

  // Tell the view to update the UI
  view._renderAllSavedPalettes(
    model.paletteModel.favorites,
    model.paletteModel.intensity,
  );

  // Persist data
  model.persistPaletteModel();
};

// Handle delete icon click
const controlDeletePalette = (paletteId) => {
  model.removePalette(paletteId);
  model.removeSavedPalette(paletteId);
  view._removePalette(paletteId);
  view._removeHarmonyPalette(paletteId);

  // check if all sections are empty
  view._checkIfAllSectionEmpty(model.paletteModel);

  // Persist data
  model.persistPaletteModel();
};

// laod data after page reload
const loadData = function () {
  // Get persisted data fron localStorage
  const storedModel = model.loadPaletteModel();
  if (!storedModel) {
    view.friendlyDisplayOnEmpty();
    return;
  }

  //  Copy properties into the existing object
  Object.assign(model.paletteModel, storedModel);

  // Recalculate tints/shades for every palette
  model.paletteModel.palettes.forEach((palette) => {
    const { tints, shades } = model.generateTintsShades(
      palette.baseColor,
      model.paletteModel.intensity,
    );
    palette.tints = tints;
    palette.shades = shades;

    // Also regenerate harmonies
    if (palette.harmoniesPalettes) {
      Object.values(palette.harmoniesPalettes)
        .flat()
        .forEach((harmony) => {
          const { tints, shades } = model.generateTintsShades(
            harmony.baseColor,
            model.paletteModel.intensity,
          );
          harmony.tints = tints;
          harmony.shades = shades;
        });
    }
  });

  // Recalculate for favorites too
  model.paletteModel.favorites.forEach((palette) => {
    const { tints, shades } = model.generateTintsShades(
      palette.baseColor,
      model.paletteModel.intensity,
    );
  });

  // Re-render UI from persisted state
  view._renderPalettes(model.paletteModel, false);

  // Re-render palettes in harmony palette container
  model.paletteModel.palettes.forEach((p) => {
    if (!p.harmoniesPalettes) return;
    Object.values(p.harmoniesPalettes).forEach((harmonies) => {
      view._renderHarmony(harmonies, model.paletteModel);
    });
  });

  // Render saved palettes
  view._renderAllSavedPalettes(
    model.paletteModel.favorites,
    model.paletteModel.intensity,
  );

  // check if all sections are empty
  view._checkIfAllSectionEmpty(model.paletteModel);
};

const controlResetApp = function () {
  // Clear persisted data
  localStorage.removeItem("paletteModel");

  // Reset in-memory mmodel
  Object.assign(model.paletteModel, {
    palettes: [],
    favorites: [],
    intensity: 10,
  });

  // Clear any existing DOM content
  view._generatedPalettesEl.innerHTML = "";
  view._harmonyPalettesEl.innerHTML = "";
  view._savedPalettesEl.innerHTML = "";

  // Show friendly empty state
  view.friendlyDisplayOnEmpty();
};

const init = function () {
  view.addHandlerSwitchMode();
  view.addHandlerInputColorPicker(controlColorInput);
  view.addHandlerGetUserInputViaColorText(controlColorInput);
  view.addHandlerGenerateBtnClicked(controlGeneratePalette);
  view.addHandlerIntensityDownloadBtns(controlIntensityChangeAndDownload);
  view.addHandlerEdit(controlEditColor);
  view.addHandlerHarmonyOverlay(controlHarmony);
  view.addHandlerHideHarmonyOverlay();
  view.addHandlerHideHarmonyOverlayEsc();
  view.addHandlerFavorite(controlToggleFavorite);
  view.addHandlerDelete(controlDeletePalette);

  // Trigger loadData automatically on page reload
  view.addHandlerPageReload(loadData);

  // Trigger app reset
  view._addHandlerResetApp(controlResetApp);
};

init();
