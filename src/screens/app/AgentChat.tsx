import React, { useMemo, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useWallet } from "../../context/WalletContext";
import { streamAgentChat, type AgentChatMessage } from "../../utilities/agentClient";

export default function AgentChat() {
  const { address } = useWallet();
  const [agentTokenId, setAgentTokenId] = useState("");
  const [model, setModel] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      role: "assistant",
      content:
        "Local agent ready. Connect your wallet, optionally provide an AgentQube/ModelQube token ID, and send a prompt.",
    },
  ]);

  const canSend = useMemo(
    () => Boolean(address && draft.trim() && !isStreaming),
    [address, draft, isStreaming]
  );

  const sendMessage = async () => {
    if (!address) {
      setError("Connect your wallet to use the agent.");
      return;
    }
    const content = draft.trim();
    if (!content) return;

    setError("");
    setDraft("");

    const nextHistory: AgentChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...nextHistory, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      await streamAgentChat(
        {
          walletAddress: address,
          messages: nextHistory,
          agentTokenId: agentTokenId ? Number(agentTokenId) : undefined,
          model: model.trim() || undefined,
        },
        {
          onToken: (token) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && last.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: `${last.content}${token}` };
              }
              return copy;
            });
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMessages(nextHistory);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-28 pb-20 px-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Chat</h1>
          <p className="text-gray-500 text-base mb-8">
            Local-first chat powered by your Node helper and Ollama.
          </p>

          {!address && (
            <div className="mb-6 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              Connect your wallet to start chatting.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent/Model Token ID (optional)
              </label>
              <input
                type="number"
                min={0}
                value={agentTokenId}
                onChange={(e) => setAgentTokenId(e.target.value)}
                placeholder="e.g. 12"
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Model Override (optional)
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama3.1:8b"
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-gray-200 p-4 mb-4 h-[420px] overflow-y-auto bg-gray-50/40">
            <div className="space-y-3">
              {messages.map((message, idx) => (
                <div
                  key={`${message.role}-${idx}`}
                  className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-black text-white ml-10"
                      : "bg-white text-gray-900 border border-gray-200 mr-10"
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
                    {message.role === "assistant" ? "Agent" : "You"}
                  </div>
                  {message.content || (isStreaming && idx === messages.length - 1 ? "..." : "")}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask your local agent..."
              rows={3}
              className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!canSend}
              className="h-[52px] px-5 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isStreaming ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Thinking
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>
            <button
              onClick={() =>
                setMessages([
                  {
                    role: "assistant",
                    content:
                      "Chat reset. Send a new prompt when ready.",
                  },
                ])
              }
              className="h-[52px] px-4 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bot size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
