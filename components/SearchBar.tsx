import React from "react";

interface SearchBarProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="mindmap-library-search">
      <span className="sr-only">Search mind maps</span>
      <span aria-hidden="true">⌕</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search mind maps…"
        aria-label="Search mind maps"
      />
    </label>
  );
}

export default SearchBar;
