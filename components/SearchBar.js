import React from "react";

function SearchBar({ value, onChange }) {
  return (
    <div className="flex mt-4 mb-8">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search file name..."
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default SearchBar;
