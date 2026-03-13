import { isCooldownActive, markSubmissionTime } from "./cooldown";

it("activates a 10-minute local cooldown after submission", () => {
  markSubmissionTime(Date.now());

  expect(isCooldownActive(Date.now())).toBe(true);
});
