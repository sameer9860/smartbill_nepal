"use client";

import { Search, X } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 z-10 h-4 w-4 shrink-0 text-slate-400" />
      <input
        type="text"
        className="input w-full"
        style={{ paddingLeft: "2.5rem", paddingRight: value ? "2.25rem" : "1rem" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 z-10 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
