import React from "react";
import { ClearIcon, SearchIcon } from "./Icons";

interface SearchBarProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onClear: () => void;
}

function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  return (
    <div className="mindmap-library-search">
      <label className="mindmap-library-search-label" htmlFor="mindmap-search">
        <span className="sr-only">Search mind maps</span>
        <SearchIcon size={16} />
      </label>
      <input
        id="mindmap-search"
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search mind maps…"
        aria-label="Search mind maps"
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="mindmap-library-search-clear"
          aria-label="Clear search"
          onClick={onClear}
        >
          <ClearIcon size={14} />
        </button>
      ) : null}
    </div>
  );
}

export default SearchBar;
