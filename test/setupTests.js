import "@testing-library/jest-dom/vitest";

if (!window.scrollTo) {
  window.scrollTo = () => {};
}