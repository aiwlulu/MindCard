"use client";

import React from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useTheme } from "@/lib/store/theme-context";
import type { ThemePreference } from "@/lib/theme";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "./Icons";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
];

export default function ThemeToggle() {
  const { preference, theme, setPreference } = useTheme();
  const CurrentIcon = theme === "dark" ? MoonIcon : SunIcon;

  return (
    <Menu as="div" className="theme-toggle">
      <MenuButton
        className="icon-button"
        aria-label="Change theme"
        title="Theme"
      >
        <CurrentIcon size={18} />
      </MenuButton>
      <MenuItems anchor="bottom end" className="menu-panel theme-toggle-menu">
        {OPTIONS.map(({ value, label, Icon }) => (
          <MenuItem key={value}>
            <button
              type="button"
              className={`menu-item${preference === value ? " is-selected" : ""}`}
              onClick={() => setPreference(value)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {preference === value ? (
                <CheckIcon size={14} className="menu-item-check" />
              ) : null}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
