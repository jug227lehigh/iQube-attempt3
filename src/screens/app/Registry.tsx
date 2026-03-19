import React, { useState, useEffect } from "react";
import {
  Database, FileText, Wrench, Brain, Bot,
  Search, Filter, ExternalLink, Loader2, Globe,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../utilities/supabase";
import Navbar from "../../components/Navbar";
import type { IQubeType } from "../../types/iqube";

interface RegistryRow {
  token_id: number;
  owner_address: string;
  minter_address: string;
  tx_hash: string;
  ipfs_url: string;
  title: string;
  description: string;
  iqube_type: IQubeType;
  category: string;
  visibility: string;
  business_model: string;
  risk_score: number;
  is_encrypted: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<IQubeType, { icon: React.ReactNode; color: string; bg: string }> = {
  DataQube:    { icon: <Database size={20} />,  color: "#2563eb", bg: "#eff6ff" },
  ContentQube: { icon: <FileText size={20} />,  color: "#9333ea", bg: "#faf5ff" },
  ToolQube:    { icon: <Wrench size={20} />,    color: "#ea580c", bg: "#fff7ed" },
  ModelQube:   { icon: <Brain size={20} />,     color: "#db2777", bg: "#fdf2f8" },
  AgentQube:   { icon: <Bot size={20} />,       color: "#059669", bg: "#ecfdf5" },
};

const ALL_TYPES: IQubeType[] = ["DataQube", "ContentQube", "ToolQube", "ModelQube", "AgentQube"];
const BUSINESS_MODELS = ["Free", "Buy", "Subscribe", "Rent", "License", "Donate"];

export default function Registry() {
  const [iqubes, setIqubes] = useState<RegistryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<IQubeType | "">("");
  const [modelFilter, setModelFilter] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    setIsLoading(true);
    setError("");
    supabase
      .from("iqubes")
      .select("*")
      .eq("access_policy", "requirements")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else {
          setIqubes((data as RegistryRow[]) ?? []);
        }
        setIsLoading(false);
      });
  }, []);

  const filtered = iqubes.filter((q) => {
    if (typeFilter && q.iqube_type !== typeFilter) return false;
    if (modelFilter && q.business_model !== modelFilter) return false;
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      if (
        !q.title.toLowerCase().includes(s) &&
        !q.description.toLowerCase().includes(s) &&
        !q.category.toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-28 pb-20 px-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">iQube Registry</h1>
          <p className="text-gray-500 text-base mb-10">
            Browse public iQubes minted on the network.
          </p>

          {!isSupabaseConfigured() && (
            <div className="mb-8 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              Supabase is not configured. Cannot load registry.
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, or category…"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as IQubeType | "")}
                className="px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-black transition-colors"
              >
                <option value="">All types</option>
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-black transition-colors"
              >
                <option value="">All pricing</option>
                {BUSINESS_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-8 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 size={24} className="animate-spin mr-3" /> Loading registry…
            </div>
          )}

          {!isLoading && filtered.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Globe size={48} className="mb-4" />
              <p className="text-lg font-medium">No public iQubes found</p>
              <p className="text-sm mt-1">
                {iqubes.length > 0
                  ? "Try adjusting your filters."
                  : "Be the first to mint a public iQube!"}
              </p>
            </div>
          )}

          {/* Results count */}
          {!isLoading && filtered.length > 0 && (
            <p className="text-sm text-gray-400 mb-4">
              {filtered.length} iQube{filtered.length !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Grid */}
          {filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {filtered.map((q) => {
                const typeMeta = TYPE_ICONS[q.iqube_type] ?? TYPE_ICONS.DataQube;
                return (
                  <div
                    key={q.token_id}
                    className="rounded-2xl border-2 border-gray-200 p-6 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}
                      >
                        {typeMeta.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 truncate">{q.title}</h3>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                            #{q.token_id}
                          </span>
                        </div>
                        {q.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{q.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: typeMeta.bg, color: typeMeta.color }}
                      >
                        {q.iqube_type}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                        {q.category}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                        {q.business_model}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500">
                        Risk {q.risk_score}/10
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-mono">
                        Minter: {q.minter_address.slice(0, 6)}…{q.minter_address.slice(-4)}
                      </span>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${q.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors"
                      >
                        <ExternalLink size={12} /> View tx
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
