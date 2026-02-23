import React, { useState, useMemo, useEffect } from "react";
import {
  Database, FileText, Wrench, Brain, Bot,
  Lock, ChevronRight, ChevronLeft, Plus, Trash2,
  Eye, EyeOff, AlertTriangle, CheckCircle, XCircle,
  Check
} from "lucide-react";
import axios from "axios";
import { useWallet } from "../../context/WalletContext";
import { useMintQube } from "../../hooks/contractHooks";
import { pinata } from "../../utilities/pinata-config";
import {
  type IQubeType, type IQubeCategory, type Visibility,
  type BusinessModel, type AccessPolicy, type BlakQubeField,
  type RiskLevel,
  calculateRiskScore, getRiskLevel, getDefaultSensitivity, getDefaultFields,
} from "../../types/iqube";

// ─────────────────────────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 bg-white border-b border-gray-200">
      <span className="text-xl font-bold text-gray-900 tracking-tight">iQube</span>
      <div>
        {address ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-mono">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
            <button
              onClick={disconnect}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Asset Type", "Basic Details", "Private Data", "Access Control", "Review"] as const;
type Step = 0 | 1 | 2 | 3 | 4;

// ─────────────────────────────────────────────────────────────────────────────
// Type options
// ─────────────────────────────────────────────────────────────────────────────

interface TypeOption {
  type: IQubeType;
  label: string;
  description: string;
  examples: string[];
  icon: React.ReactNode;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  categories: IQubeCategory[];
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "DataQube",
    label: "Data Asset",
    description: "Credentials, profiles, personal information",
    examples: ["Password manager", "Identity vault", "Contact list"],
    icon: <Database size={28} />,
    iconColor: "#2563eb",
    borderColor: "#3b82f6",
    bgColor: "#eff6ff",
    categories: ["Credentials", "Profile", "Financial", "Health", "Other"],
  },
  {
    type: "ContentQube",
    label: "Content Asset",
    description: "Documents, media, creative works",
    examples: ["Research papers", "Images", "Articles"],
    icon: <FileText size={28} />,
    iconColor: "#9333ea",
    borderColor: "#a855f7",
    bgColor: "#faf5ff",
    categories: ["Article", "Research", "Video", "Image", "Other"],
  },
  {
    type: "ToolQube",
    label: "Tool Asset",
    description: "APIs, scripts, utilities",
    examples: ["REST APIs", "Automation scripts", "Plugins"],
    icon: <Wrench size={28} />,
    iconColor: "#ea580c",
    borderColor: "#f97316",
    bgColor: "#fff7ed",
    categories: ["REST API", "Function", "Script", "Plugin", "Other"],
  },
  {
    type: "ModelQube",
    label: "Model Asset",
    description: "AI/ML models, algorithms",
    examples: ["Neural networks", "Classifiers", "Predictors"],
    icon: <Brain size={28} />,
    iconColor: "#db2777",
    borderColor: "#ec4899",
    bgColor: "#fdf2f8",
    categories: ["LLM", "Classifier", "Neural Network", "Predictor", "Other"],
  },
  {
    type: "AgentQube",
    label: "Agent Asset",
    description: "Autonomous agents, bots",
    examples: ["Trading bots", "Chatbots", "Task automation"],
    icon: <Bot size={28} />,
    iconColor: "#059669",
    borderColor: "#10b981",
    bgColor: "#ecfdf5",
    categories: ["Trading Bot", "Chatbot", "Task Automation", "Orchestrator", "Other"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Wizard state
// ─────────────────────────────────────────────────────────────────────────────

interface WizardState {
  iQubeType: IQubeType | null;
  category: IQubeCategory | null;
  title: string;
  description: string;
  visibility: Visibility;
  fields: BlakQubeField[];
  accessPolicy: AccessPolicy;
  allowedAddresses: string;
  businessModel: BusinessModel;
  price: string;
  canView: boolean;
  canUse: boolean;
  canEdit: boolean;
  canDecrypt: boolean;
  canFork: boolean;
}

const INITIAL_STATE: WizardState = {
  iQubeType: null,
  category: null,
  title: "",
  description: "",
  visibility: "private",
  fields: [],
  accessPolicy: "only-me",
  allowedAddresses: "",
  businessModel: "Free",
  price: "",
  canView: true,
  canUse: true,
  canEdit: false,
  canDecrypt: true,
  canFork: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  return (
    <div className="w-full mb-12">
      <div className="h-1 w-full bg-gray-200 rounded-full mb-6">
        <div
          className="h-1 bg-black rounded-full transition-all duration-500"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <div className="flex justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
              i < current
                ? "bg-black border-black text-white"
                : i === current
                ? "bg-white border-black text-black"
                : "bg-white border-gray-300 text-gray-400"
            }`}>
              {i < current ? <Check size={15} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === current ? "text-black" : i < current ? "text-gray-500" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav buttons
// ─────────────────────────────────────────────────────────────────────────────

function NavButtons({ step, onBack, onNext, nextLabel = "Continue", nextDisabled = false }: {
  step: Step; onBack: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
      {step > 0 ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </button>
      ) : <div />}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {nextLabel} <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Asset Type
// ─────────────────────────────────────────────────────────────────────────────

function Step1AssetType({ state, onChange }: { state: WizardState; onChange: (s: Partial<WizardState>) => void }) {
  const selectedOption = TYPE_OPTIONS.find(o => o.type === state.iQubeType);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">What are you creating?</h2>
      <p className="text-gray-500 text-base mb-10">Choose the type that best describes your asset.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "40px" }}>
        {TYPE_OPTIONS.map((opt) => {
          const selected = state.iQubeType === opt.type;
          return (
            <div
              key={opt.type}
              onClick={() => onChange({ iQubeType: opt.type, category: null, fields: [] })}
              style={{
                padding: "28px",
                borderRadius: "16px",
                border: selected ? `2px solid` : "2px solid #e5e7eb",
                borderColor: selected ? opt.borderColor : "#e5e7eb",
                backgroundColor: selected ? opt.bgColor : "#ffffff",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <div style={{ color: opt.iconColor, marginBottom: "16px" }}>{opt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#111827", marginBottom: "6px" }}>{opt.label}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>{opt.description}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {opt.examples.map(ex => (
                  <span key={ex} style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "12px", backgroundColor: "#f3f4f6", color: "#4b5563" }}>{ex}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOption && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Pick a category</p>
          <div className="flex flex-wrap gap-3">
            {selectedOption.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onChange({ category: cat, fields: getDefaultFields(selectedOption.type, cat) })}
                style={{
                  padding: "8px 20px",
                  borderRadius: "12px",
                  border: `2px solid ${state.category === cat ? selectedOption.borderColor : "#e5e7eb"}`,
                  backgroundColor: state.category === cat ? selectedOption.bgColor : "#ffffff",
                  color: state.category === cat ? selectedOption.iconColor : "#4b5563",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Basic Details
// ─────────────────────────────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string; desc: string }> = [
  { value: "private",      label: "Just me",             desc: "Only you can see this exists" },
  { value: "semi-private", label: "People I share with", desc: "Visible to specific addresses" },
  { value: "public",       label: "Public marketplace",  desc: "Anyone can discover this" },
];

function Step2BasicDetails({ state, onChange }: { state: WizardState; onChange: (s: Partial<WizardState>) => void }) {
  const selectedType = TYPE_OPTIONS.find(o => o.type === state.iQubeType);
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Basic Details</h2>
      <p className="text-gray-500 text-base mb-10">Describe your {selectedType?.label ?? "asset"}.</p>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={state.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder={
              state.iQubeType === "DataQube" ? "e.g. Gmail Account" :
              state.iQubeType === "ContentQube" ? "e.g. AI Ethics Research Paper" :
              "e.g. Weather API Service"
            }
            className="w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={state.description}
            onChange={e => onChange({ description: e.target.value })}
            rows={4}
            placeholder="What is this asset? What does it contain or do?"
            className="w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-base resize-none focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Who can see this exists?</label>
          <div className="space-y-3">
            {VISIBILITY_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-5 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
                  state.visibility === opt.value
                    ? "bg-gray-50 border-black"
                    : "bg-white border-gray-200 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={state.visibility === opt.value}
                  onChange={() => onChange({ visibility: opt.value })}
                  className="w-4 h-4 accent-black"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Private Data
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({ field, index, onChange, onRemove }: {
  field: BlakQubeField; index: number;
  onChange: (i: number, f: BlakQubeField) => void; onRemove: (i: number) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={field.label}
        onChange={e => onChange(index, { ...field, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
        placeholder="Field name"
        className="w-44 px-4 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
      />
      <div className="flex-1 relative">
        <input
          type={field.isSecret && !show ? "password" : "text"}
          value={field.value}
          onChange={e => onChange(index, { ...field, value: e.target.value })}
          placeholder="Value"
          className="w-full px-4 py-3 pr-11 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
        />
        {field.isSecret && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <button type="button"
        onClick={() => onChange(index, { ...field, isSecret: !field.isSecret })}
        title={field.isSecret ? "Marked secret" : "Mark as secret"}
        className={`p-3 rounded-xl border-2 transition-colors ${
          field.isSecret ? "bg-amber-50 border-amber-400 text-amber-600" : "bg-white border-gray-200 text-gray-400 hover:border-gray-400"
        }`}>
        <Lock size={16} />
      </button>
      <button type="button" onClick={() => onRemove(index)}
        className="p-3 rounded-xl border-2 border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function Step3PrivateData({ state, onChange }: { state: WizardState; onChange: (s: Partial<WizardState>) => void }) {
  const updateField = (i: number, f: BlakQubeField) => {
    const fields = [...state.fields]; fields[i] = f; onChange({ fields });
  };
  const removeField = (i: number) => onChange({ fields: state.fields.filter((_, idx) => idx !== i) });
  const addField = () => onChange({
    fields: [...state.fields, { key: `field_${state.fields.length}`, label: "", value: "", isSecret: false }],
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Private Data</h2>
      <p className="text-gray-500 text-base mb-4">This data will be encrypted. Only you (and those you authorize) can decrypt it.</p>

      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm mb-10">
        <Lock size={15} />
        All fields are encrypted with your key before being stored on IPFS.
      </div>

      {state.fields.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm rounded-2xl border-2 border-dashed border-gray-200">
          No private fields yet.
          <br />
          <span className="text-gray-300 text-xs">Skip this if your asset has no sensitive data.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-gray-400 px-1 mb-2">
            <span className="w-44">Field name</span>
            <span className="flex-1">Value</span>
            <span className="w-11 text-center">Secret</span>
            <span className="w-11" />
          </div>
          {state.fields.map((f, i) => (
            <FieldRow key={i} field={f} index={i} onChange={updateField} onRemove={removeField} />
          ))}
        </div>
      )}

      <button onClick={addField}
        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-gray-600 border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors">
        <Plus size={16} /> Add field
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Access Control
// ─────────────────────────────────────────────────────────────────────────────

const BUSINESS_MODELS: Array<{ value: BusinessModel; label: string; desc: string; hasPrice: boolean; placeholder?: string }> = [
  { value: "Free",      label: "Free",      desc: "No cost",          hasPrice: false },
  { value: "Buy",       label: "Buy",       desc: "One-time payment", hasPrice: true,  placeholder: "Price (e.g. 9.99)" },
  { value: "Subscribe", label: "Subscribe", desc: "Monthly fee",      hasPrice: true,  placeholder: "Price/month" },
  { value: "Rent",      label: "Rent",      desc: "Pay per use",      hasPrice: true,  placeholder: "Price per use" },
  { value: "License",   label: "License",   desc: "License fee",      hasPrice: true,  placeholder: "License fee" },
  { value: "Donate",    label: "Donate",    desc: "Voluntary",        hasPrice: false },
];

const ACCESS_OPTIONS: Array<{ value: AccessPolicy; label: string; desc: string }> = [
  { value: "only-me",      label: "Only me",              desc: "Completely private — just you" },
  { value: "specific",     label: "Specific addresses",   desc: "Share with chosen wallets" },
  { value: "requirements", label: "Open with conditions", desc: "Anyone who meets your requirements" },
];

function Step4AccessControl({ state, onChange }: { state: WizardState; onChange: (s: Partial<WizardState>) => void }) {
  const selectedBM = BUSINESS_MODELS.find(o => o.value === state.businessModel)!;
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Control</h2>
      <p className="text-gray-500 text-base mb-10">Who can access this, and how is it priced?</p>

      <div className="space-y-10">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Who can access this?</label>
          <div className="space-y-3">
            {ACCESS_OPTIONS.map(opt => (
              <label key={opt.value}
                className={`flex items-center gap-5 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
                  state.accessPolicy === opt.value ? "bg-gray-50 border-black" : "bg-white border-gray-200 hover:border-gray-400"
                }`}>
                <input type="radio" name="accessPolicy" checked={state.accessPolicy === opt.value}
                  onChange={() => onChange({ accessPolicy: opt.value })} className="w-4 h-4 accent-black" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
          {state.accessPolicy === "specific" && (
            <input type="text" value={state.allowedAddresses}
              onChange={e => onChange({ allowedAddresses: e.target.value })}
              placeholder="0xabc..., 0xdef... (comma-separated)"
              className="mt-4 w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Pricing model</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {BUSINESS_MODELS.map(opt => (
              <button key={opt.value} onClick={() => onChange({ businessModel: opt.value })}
                className={`text-left px-5 py-4 rounded-xl text-sm border-2 transition-colors ${
                  state.businessModel === opt.value
                    ? "bg-gray-50 border-black text-gray-900"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                }`}>
                <div className="font-semibold">{opt.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          {selectedBM.hasPrice && (
            <input type="number" min={0} value={state.price}
              onChange={e => onChange({ price: e.target.value })}
              placeholder={selectedBM.placeholder}
              className="mt-4 w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Review
// ─────────────────────────────────────────────────────────────────────────────

const RISK_META: Record<RiskLevel, { label: string; textColor: string; bg: string; border: string; icon: React.ReactNode }> = {
  low:      { label: "Low Risk",      textColor: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", icon: <CheckCircle size={18} /> },
  medium:   { label: "Medium Risk",   textColor: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-300",  icon: <AlertTriangle size={18} /> },
  high:     { label: "High Risk",     textColor: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-300",  icon: <AlertTriangle size={18} /> },
  critical: { label: "Critical Risk", textColor: "text-red-700",     bg: "bg-red-50",     border: "border-red-300",     icon: <XCircle size={18} /> },
};

function Step5Review({ state, onSubmit, isSubmitting, mintError, txHash }: {
  state: WizardState; onSubmit: () => void; isSubmitting: boolean; mintError: string; txHash: string;
}) {
  const sensitivity = state.iQubeType ? getDefaultSensitivity(state.iQubeType, state.category ?? "Other" as IQubeCategory) : 5;
  const riskScore = calculateRiskScore(sensitivity, 5, 5);
  const riskLevel = getRiskLevel(riskScore);
  const rm = RISK_META[riskLevel];
  const typeMeta = TYPE_OPTIONS.find(o => o.type === state.iQubeType);

  const rows = [
    { label: "Type",          value: `${state.iQubeType} · ${state.category}` },
    { label: "Name",          value: state.title || "—" },
    { label: "Visibility",    value: state.visibility.replace("-", " ") },
    { label: "Private fields",value: `${state.fields.length} field${state.fields.length !== 1 ? "s" : ""}` },
    { label: "Access",        value: state.accessPolicy === "only-me" ? "Only me" : state.accessPolicy === "specific" ? "Specific addresses" : "Requirement-based" },
    { label: "Pricing",       value: `${state.businessModel}${state.price ? ` · $${state.price}` : ""}` },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Review your iQube</h2>
      <p className="text-gray-500 text-base mb-10">Confirm the details before minting on-chain.</p>

      <div className={`flex items-center gap-3 px-6 py-5 rounded-2xl border-2 mb-8 ${rm.bg} ${rm.border}`}>
        <span className={`flex items-center gap-2 font-bold text-base ${rm.textColor}`}>
          {rm.icon} {rm.label}
        </span>
        <span className="text-gray-400 text-sm">({riskScore}/10, auto-calculated)</span>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 divide-y divide-gray-100 mb-8">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between items-center px-6 py-4">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className={`text-sm font-semibold text-gray-900 capitalize flex items-center gap-2`}>
              {row.label === "Type" && <span style={{ color: typeMeta?.iconColor }}>{typeMeta?.icon}</span>}
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {mintError && (
        <div className="mb-6 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{mintError}</div>
      )}
      {txHash && (
        <div className="mb-6 px-5 py-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          Minted!{" "}
          <a href={`https://www.oklink.com/amoy/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            View transaction ↗
          </a>
        </div>
      )}

      <button onClick={onSubmit} disabled={isSubmitting || !!txHash}
        className="w-full py-5 rounded-2xl text-base font-bold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {isSubmitting ? "Minting iQube…" : txHash ? "Minted ✓" : "Mint iQube"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateIQubeWizard() {
  const { address } = useWallet();
  const [step, setStep] = useState<Step>(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mintError, setMintError] = useState("");
  const [txHash, setTxHash] = useState("");

  const { mintQube, transactionResult, transactionError } = useMintQube(null, null);

  useEffect(() => {
    if (transactionResult?.transactionHash) setTxHash(transactionResult.transactionHash);
  }, [transactionResult]);

  useEffect(() => {
    if (transactionError) setMintError(transactionError.message);
  }, [transactionError]);

  const update = (partial: Partial<WizardState>) => setState(s => ({ ...s, ...partial }));

  const canAdvance = useMemo(() => {
    if (step === 0) return !!state.iQubeType && !!state.category;
    if (step === 1) return !!state.title.trim();
    return true;
  }, [step, state.iQubeType, state.category, state.title]);

  const next = () => setStep(s => Math.min(4, s + 1) as Step);
  const back = () => setStep(s => Math.max(0, s - 1) as Step);

  const handleSubmit = async () => {
    if (!address) { setMintError("Please connect your wallet first."); return; }
    setIsSubmitting(true);
    setMintError("");
    try {
      const blakQubePayload: Record<string, string> = {};
      for (const f of state.fields) blakQubePayload[f.key] = f.value;

      let encryptedBlakQube: string;
      let encryptionKey: string;

      if (state.fields.length > 0) {
        try {
          const { data } = await axios.post("https://iqubes-server.onrender.com/encrypt-member-qube", blakQubePayload);
          if (!data.success) throw new Error(data.message || "Encryption failed");
          encryptedBlakQube = data.encryptedData.encryptedBlakQube;
          encryptionKey = data.encryptedData.key;
        } catch (encErr: unknown) {
          const msg = encErr instanceof Error ? encErr.message : String(encErr);
          if (/FORBIDDEN|plan usage limit/i.test(msg)) {
            setMintError("Encryption server is over its plan limit. Remove private fields to mint without encryption.");
            return;
          }
          throw encErr;
        }
      } else {
        encryptedBlakQube = "";
        encryptionKey = "no-blakqube";
      }

      const sensitivity = state.iQubeType ? getDefaultSensitivity(state.iQubeType, state.category ?? "Other" as IQubeCategory) : 5;
      const riskScore = calculateRiskScore(sensitivity, 5, 5);

      const metadataJson = {
        name: state.title || `iQube #${Date.now()}`,
        description: state.description,
        image: "",
        attributes: [
          { trait_type: "iQubeType",    value: state.iQubeType },
          { trait_type: "category",     value: state.category },
          { trait_type: "visibility",   value: state.visibility },
          { trait_type: "riskScore",    value: riskScore },
          { trait_type: "accessPolicy", value: state.accessPolicy },
          { trait_type: "businessModel",value: state.businessModel },
          { trait_type: "isEncrypted",  value: state.fields.length > 0 },
          { trait_type: "blakQube",     value: encryptedBlakQube },
        ],
      };

      const upload = await pinata.upload.json(metadataJson);
      const metaQubeLocation = `${import.meta.env.VITE_GATEWAY_URL}/ipfs/${upload.IpfsHash}`;
      await mintQube(metaQubeLocation, encryptionKey);
    } catch (err: unknown) {
      setMintError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-28 pb-20 px-10">
        <div className="max-w-4xl mx-auto">
          {!address && (
            <div className="mb-8 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              Connect your wallet before minting. You can fill in the form first.
            </div>
          )}
          <StepBar current={step} />
          <div className="min-h-96">
            {step === 0 && <Step1AssetType state={state} onChange={update} />}
            {step === 1 && <Step2BasicDetails state={state} onChange={update} />}
            {step === 2 && <Step3PrivateData state={state} onChange={update} />}
            {step === 3 && <Step4AccessControl state={state} onChange={update} />}
            {step === 4 && <Step5Review state={state} onSubmit={handleSubmit} isSubmitting={isSubmitting} mintError={mintError} txHash={txHash} />}
          </div>
          {step < 4 && (
            <NavButtons step={step} onBack={back} onNext={next}
              nextLabel={step === 3 ? "Review" : "Continue"} nextDisabled={!canAdvance} />
          )}
        </div>
      </div>
    </div>
  );
}
