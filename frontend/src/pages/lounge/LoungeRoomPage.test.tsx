import userEvent from "@testing-library/user-event";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import LoungeRoomPage from "./LoungeRoomPage";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  onclose: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  send = vi.fn();

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  close() {}

  emit(payload: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
  }
}

afterEach(() => {
  localStorage.clear();
  MockWebSocket.instances = [];
  vi.restoreAllMocks();
});

it("enters the room from a saved local ticket and unlocks chat after claim", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  localStorage.setItem(
    "techvoice-lounge-ticket:acme:42",
    JSON.stringify({
      ticket_code: "TKT-ABCD1234",
      entry_token: "entry-token",
      alias_label: "匿名者A",
    }),
  );

  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        ticket_code: "TKT-ABCD1234",
        alias_label: "匿名者A",
        session_id: 12,
        entered: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/t/acme/lounge/42/room"]}>
      <Routes>
        <Route path="/t/:tenantSlug/lounge/:eventId/room" element={<LoungeRoomPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByRole("heading", { level: 1, name: "匿名会客厅" })).toBeInTheDocument();
  expect(screen.getByText(/只保存在当前浏览器的 localStorage 中/i)).toBeInTheDocument();

  await act(async () => {
    MockWebSocket.instances[0]?.emit({
      type: "session_claimed",
      session_id: 12,
      executive_name: "Alice Wang",
    });
  });

  const textarea = screen.getByRole("textbox", { name: "继续匿名发言" });
  await waitFor(() => expect(textarea).toBeEnabled());

  await user.type(textarea, "我想继续补充上下文。");
  await user.click(screen.getByRole("button", { name: "发送匿名消息" }));

  expect(MockWebSocket.instances[0]?.send).toHaveBeenCalledWith(
    JSON.stringify({
      type: "send_message",
      content: "我想继续补充上下文。",
    }),
  );
});
