import styles from "./styles.css?inline";

it("does not force all hero panel h1 elements to use the oversized title rule", () => {
  expect(styles).not.toContain(".hero-panel h1");
});
