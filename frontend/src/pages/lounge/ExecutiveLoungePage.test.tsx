import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ExecutiveLoungePage from "./ExecutiveLoungePage";

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

it("loads the waiting queue, claims a session, and sends a reply through websocket", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  localStorage.setItem("techvoice-executive-token:acme", "executive-token");

  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              session_id: 12,
              event_id: 42,
              alias_label: "匿名者A",
              entered_at: "2026-03-13T06:00:00Z",
              created_at: "2026-03-13T06:00:00Z",
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session_id: 12,
          status: "active",
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
    <MemoryRouter initialEntries={["/t/acme/executive/lounge"]}>
      <Routes>
        <Route path="/t/:tenantSlug/executive/lounge" element={<ExecutiveLoungePage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("匿名者A")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "接单" }));

  expect(await screen.findByRole("button", { name: "匿名者A" })).toBeInTheDocument();

  await act(async () => {
    MockWebSocket.instances[0]?.emit({
      type: "message_sent",
      session_id: 12,
      sender_type: "participant",
      sender_label: "匿名者A",
      content: "我想聊聊跨团队协作。",
    });
  });

  expect(await screen.findByText("我想聊聊跨团队协作。")).toBeInTheDocument();

  await user.type(screen.getByRole("textbox", { name: "发送回复" }), "收到，我们继续拆解。");
  await user.click(screen.getByRole("button", { name: "发送回复" }));

  expect(MockWebSocket.instances[0]?.send).toHaveBeenCalledWith(
    JSON.stringify({
      type: "send_message",
      session_id: 12,
      content: "收到，我们继续拆解。",
    }),
  );
});
