// Runs before hydration via a raw <script> tag in the root layout. Kept as
// a plain string (not a React component) so it executes synchronously in
// <head>, before the page paints — the standard fix for theme-toggle FOUC.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('querypro-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;
