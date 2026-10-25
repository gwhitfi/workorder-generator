// Light/dark theme. The theme is the data-theme attribute on <html>; globals.css switches colors on it.
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

// Runs in <head> before the page paints, so there's no flash of the wrong theme.
// Uses the saved choice, or the device setting when nothing is saved.
export const themeScript =
    `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
    `if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";` +
    `document.documentElement.dataset.theme=t}catch(e){}`;
