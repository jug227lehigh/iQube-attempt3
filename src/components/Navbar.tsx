import { useWallet } from "../context/WalletContext";
import { NavLink } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Mint" },
  { to: "/my-iqubes", label: "My iQubes" },
  { to: "/decrypt", label: "Decrypt" },
  { to: "/transfer", label: "Transfer" },
  { to: "/registry", label: "Registry" },
];

export default function Navbar() {
  const { address, isConnecting, connect, disconnect } = useWallet();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 bg-white border-b border-gray-200">
      <div className="flex items-center gap-10">
        <span className="text-xl font-bold text-gray-900 tracking-tight">iQube</span>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
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
