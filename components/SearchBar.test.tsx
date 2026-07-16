import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("shows an accessible clear button only when the search has text", () => {
    const { rerender } = render(
      <SearchBar
        value="new mind map"
        onChange={jest.fn()}
        onClear={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();

    rerender(
      <SearchBar
        value=""
        onChange={jest.fn()}
        onClear={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Clear search" })
    ).not.toBeInTheDocument();
  });

  it("calls onClear when the clear button is activated", () => {
    const onClear = jest.fn();

    render(
      <SearchBar
        value="new mind map"
        onChange={jest.fn()}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("disables browser autocomplete for the app-managed search value", () => {
    render(
      <SearchBar
        value=""
        onChange={jest.fn()}
        onClear={jest.fn()}
      />
    );

    expect(screen.getByRole("textbox", { name: "Search mind maps" })).toHaveAttribute(
      "autocomplete",
      "off"
    );
  });
});
