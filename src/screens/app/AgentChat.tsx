import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquarePlus, Send, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useWallet } from "../../context/WalletContext";
import { streamAgentChat, type AgentChatMessage } from "../../utilities/agentClient";
import {
  resolveSelectedIqubeContexts,
  MAX_CONTEXT_TOKENS_PER_REQUEST,
} from "../../utilities/chatContextResolver";
import { isSupabaseConfigured, supabase } from "../../utilities/supabase";

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AgentChatMessage[];
  selectedContextTokenIds: number[];
}

interface ContextIQube {
  token_id: number;
  title: string;
  iqube_type: string;
  is_encrypted?: boolean;
}

function makeConversation(): Conversation {
  const now = Date.now();
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${now}-${Math.random().toString(16).slice(2)}`;
  return {
    id,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        role: "assistant",
        content:
          "Agent is ready. Add iQubes as context (optional), then send your prompt.",
      },
    ],
    selectedContextTokenIds: [],
  };
}

export default function AgentChat() {
  const { address } = useWallet();
  const [conversations, setConversations] = useState<Conversation[]>(() => [makeConversation()]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [availableIqubes, setAvailableIqubes] = useState<ContextIQube[]>([]);
  const [isLoadingIqubes, setIsLoadingIqubes] = useState(false);
  const [iqubesError, setIqubesError] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isResolvingContext, setIsResolvingContext] = useState(false);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!address || !isSupabaseConfigured() || !supabase) {
      setAvailableIqubes([]);
      setIqubesError("");
      return;
    }
    setIsLoadingIqubes(true);
    setIqubesError("");
    supabase
      .from("iqubes")
      .select("token_id,title,iqube_type,is_encrypted")
      .eq("owner_address", address)
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setIqubesError(queryError.message);
          setAvailableIqubes([]);
        } else {
          setAvailableIqubes((data as ContextIQube[]) ?? []);
        }
      })
      .finally(() => setIsLoadingIqubes(false));
  }, [address]);

  const activeConversation = useMemo(() => {
    if (conversations.length === 0) return null;
    return conversations.find((item) => item.id === activeConversationId) ?? conversations[0];
  }, [activeConversationId, conversations]);

  const canSend = useMemo(
    () => Boolean(address && draft.trim() && !isStreaming && !isResolvingContext && activeConversation),
    [activeConversation, address, draft, isResolvingContext, isStreaming]
  );
  const selectedEncryptedCount = useMemo(() => {
    if (!activeConversation) return 0;
    return activeConversation.selectedContextTokenIds.filter((tokenId) => {
      const item = availableIqubes.find((qube) => qube.token_id === tokenId);
      return Boolean(item?.is_encrypted);
    }).length;
  }, [activeConversation, availableIqubes]);

  const updateConversation = (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        const updated = updater(conversation);
        return { ...updated, updatedAt: Date.now() };
      })
    );
  };

  const createConversation = () => {
    const next = makeConversation();
    setConversations((prev) => [next, ...prev]);
    setActiveConversationId(next.id);
    setShowContextPicker(false);
    setError("");
    setDraft("");
  };

  const toggleContextToken = (tokenId: number) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conversation) => {
      const hasToken = conversation.selectedContextTokenIds.includes(tokenId);
      if (
        !hasToken &&
        conversation.selectedContextTokenIds.length >= MAX_CONTEXT_TOKENS_PER_REQUEST
      ) {
        setError(
          `You can attach up to ${MAX_CONTEXT_TOKENS_PER_REQUEST} iQubes as context in one request.`
        );
        return conversation;
      }
      const selectedContextTokenIds = hasToken
        ? conversation.selectedContextTokenIds.filter((id) => id !== tokenId)
        : [...conversation.selectedContextTokenIds, tokenId].sort((a, b) => a - b);
      return { ...conversation, selectedContextTokenIds };
    });
  };

  const removeContextToken = (tokenId: number) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      selectedContextTokenIds: conversation.selectedContextTokenIds.filter((id) => id !== tokenId),
    }));
  };

  const sendMessage = async () => {
    if (!address) {
      setError("Connect your wallet to use the agent.");
      return;
    }
    if (!activeConversation) return;
    const content = draft.trim();
    if (!content) return;

    setError("");

    const conversationId = activeConversation.id;
    const contextTokenIds = activeConversation.selectedContextTokenIds;
    let contextSystemMessage: AgentChatMessage | undefined;
    let hasEncryptedContext = false;

    setIsResolvingContext(true);
    try {
      if (contextTokenIds.length > 0) {
        const contextBundle = await resolveSelectedIqubeContexts({
          tokenIds: contextTokenIds,
          walletAddress: address,
        });
        contextSystemMessage = contextBundle.systemMessage;
        hasEncryptedContext = contextBundle.hasEncryptedContext;
      }
    } catch (contextError) {
      setError(contextError instanceof Error ? contextError.message : String(contextError));
      setIsResolvingContext(false);
      return;
    }
    setIsResolvingContext(false);
    setDraft("");

    const nextHistory: AgentChatMessage[] = [...activeConversation.messages, { role: "user", content }];
    const requestMessages = contextSystemMessage
      ? [contextSystemMessage, ...nextHistory]
      : nextHistory;
    updateConversation(conversationId, (conversation) => {
      const title = conversation.title === "New chat" ? content.slice(0, 40) : conversation.title;
      return {
        ...conversation,
        title: title || "New chat",
        messages: [...nextHistory, { role: "assistant", content: "" }],
      };
    });
    setIsStreaming(true);

    try {
      await streamAgentChat(
        {
          walletAddress: address,
          messages: requestMessages,
          contextTokenIds,
        },
        {
          onToken: (token) => {
            updateConversation(conversationId, (conversation) => {
              const copy = [...conversation.messages];
              const last = copy[copy.length - 1];
              if (!last || last.role !== "assistant") return conversation;
              copy[copy.length - 1] = { ...last, content: `${last.content}${token}` };
              return { ...conversation, messages: copy };
            });
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      updateConversation(conversationId, (conversation) => ({ ...conversation, messages: nextHistory }));
    } finally {
      setIsStreaming(false);
      if (hasEncryptedContext) {
        setShowContextPicker(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Chat</h1>
          <p className="text-gray-500 text-base mb-6">
            Local-first chat with multi-thread windows and optional iQube context.
          </p>

          {!address && (
            <div className="mb-6 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              Connect your wallet to start chatting.
            </div>
          )}

          <div className="h-[calc(100vh-10rem)] min-h-[620px] rounded-2xl border border-gray-200 bg-white overflow-hidden flex">
            <aside className="w-[320px] border-r border-gray-200 bg-gray-50/70 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={createConversation}
                  disabled={isStreaming}
                  className="w-full h-11 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MessageSquarePlus size={16} />
                  New chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversation?.id;
                  const lastMessage = conversation.messages[conversation.messages.length - 1];
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        setShowContextPicker(false);
                      }}
                      className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                        isActive
                          ? "bg-white border-gray-300"
                          : "bg-transparent border-transparent hover:bg-white/80"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-800 truncate">{conversation.title}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {lastMessage?.content || "No messages yet"}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2">
                        {conversation.selectedContextTokenIds.length} iQube context
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeConversation?.title || "Chat"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {activeConversation?.messages.length ?? 0} messages
                  </p>
                </div>
                <button
                  onClick={() => setShowContextPicker((prev) => !prev)}
                  className="h-10 px-4 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Add iQubes as context
                </button>
              </div>

              {showContextPicker && (
                <div className="border-b border-gray-200 px-5 py-4 bg-gray-50/60">
                  {!address && (
                    <p className="text-sm text-amber-700">
                      Connect wallet to load your iQubes.
                    </p>
                  )}
                  {address && !isSupabaseConfigured() && (
                    <p className="text-sm text-red-700">
                      Supabase is not configured, so iQube context cannot be loaded.
                    </p>
                  )}
                  {address && isSupabaseConfigured() && (
                    <>
                      {isLoadingIqubes && (
                        <p className="text-sm text-gray-500">Loading iQubes...</p>
                      )}
                      {iqubesError && (
                        <p className="text-sm text-red-700">{iqubesError}</p>
                      )}
                      {!isLoadingIqubes && !iqubesError && availableIqubes.length === 0 && (
                        <p className="text-sm text-gray-500">No iQubes found for this wallet.</p>
                      )}
                      {!isLoadingIqubes && availableIqubes.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {availableIqubes.map((iqube) => {
                            const checked = Boolean(
                              activeConversation?.selectedContextTokenIds.includes(iqube.token_id)
                            );
                            return (
                              <label
                                key={iqube.token_id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                <div>
                                  <p className="text-gray-900 font-medium">
                                    {iqube.title || `iQube #${iqube.token_id}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    #{iqube.token_id} · {iqube.iqube_type}
                                    {iqube.is_encrypted ? " · Encrypted" : ""}
                                  </p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleContextToken(iqube.token_id)}
                                  className="h-4 w-4"
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/30">
                <div className="space-y-3">
                  {activeConversation?.messages.map((message, idx) => (
                    <div
                      key={`${activeConversation.id}-${message.role}-${idx}`}
                      className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-black text-white ml-10"
                          : "bg-white text-gray-900 border border-gray-200 mr-10"
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
                        {message.role === "assistant" ? "Agent" : "You"}
                      </div>
                      {message.content ||
                        (isStreaming && idx === (activeConversation.messages.length ?? 0) - 1 ? "..." : "")}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mx-5 mt-3 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {activeConversation && activeConversation.selectedContextTokenIds.length > 0 && (
                <div className="px-5 pt-3 flex flex-wrap gap-2">
                  {activeConversation.selectedContextTokenIds.map((tokenId) => {
                    const matching = availableIqubes.find((item) => item.token_id === tokenId);
                    return (
                      <span
                        key={tokenId}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-50 border border-blue-200 text-blue-700"
                      >
                        {matching?.title || "iQube"} #{tokenId}
                        <button
                          type="button"
                          onClick={() => removeContextToken(tokenId)}
                          className="hover:opacity-80"
                          aria-label={`Remove iQube ${tokenId}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {activeConversation && activeConversation.selectedContextTokenIds.length > 0 && (
                <div className="mx-5 mt-3 px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs">
                  {activeConversation.selectedContextTokenIds.length} iQube(s) will be resolved and sent as
                  chat context for the next request. This data is not persisted by the chat UI.
                </div>
              )}

              {selectedEncryptedCount > 0 && (
                <div className="mx-5 mt-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                  {selectedEncryptedCount} selected iQube(s) are encrypted. They will be decrypted client-side
                  with wallet authorization, then included in the model prompt for this request.
                </div>
              )}

              <div className="px-5 py-4 border-t border-gray-200 bg-white">
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
                    {isResolvingContext ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Resolving Context
                      </>
                    ) : isStreaming ? (
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
