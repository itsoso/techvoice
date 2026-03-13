import { getSavedLoungeTicket, saveLoungeTicket } from "./loungeTickets";

afterEach(() => {
  localStorage.clear();
});

it("stores lounge tickets only in localStorage for the current tenant and event", () => {
  saveLoungeTicket("acme", "42", {
    ticket_code: "TKT-ABCD1234",
    entry_token: "entry-token",
    alias_label: "匿名者A",
  });

  expect(getSavedLoungeTicket("acme", "42")).toEqual({
    ticket_code: "TKT-ABCD1234",
    entry_token: "entry-token",
    alias_label: "匿名者A",
  });
  expect(getSavedLoungeTicket("acme", "43")).toBeNull();
});
