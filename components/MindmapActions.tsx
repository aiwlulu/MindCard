"use client";

import React from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { DownloadIcon, FolderIcon, SaveIcon } from "./Icons";
import debounce from "@/lib/utils/debounce";

interface MindmapActionsProps {
  onSave: () => void;
  onNavigateToMindmap: () => void;
  onExport: (format: string) => void;
}

export default function MindmapActions({
  onSave,
  onNavigateToMindmap,
  onExport,
}: MindmapActionsProps) {
  const debouncedSaveMindmap = debounce(() => {
    onSave();
  }, 300);

  return (
    <>
      <button
        onClick={debouncedSaveMindmap}
        className="btn btn-primary lg:mr-4"
      >
        <SaveIcon size={20} className="block lg:hidden" />
        <span className="hidden lg:block">Save</span>
      </button>

      <button
        onClick={onNavigateToMindmap}
        className="btn btn-primary lg:mr-4 hidden md:block"
      >
        <FolderIcon size={20} className="block lg:hidden" />
        <span className="hidden lg:block">Folder</span>
      </button>

      <Menu as="div" className="relative inline-block text-left">
        <MenuButton className="btn btn-primary flex items-center gap-2">
          <DownloadIcon size={20} className="block lg:hidden" />
          <span className="hidden lg:block">Export</span>
        </MenuButton>
        <MenuItems className="absolute right-0 mt-2 w-40 bg-slate-700 text-white shadow-md rounded-md py-1 z-50">
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <button
                onClick={() => onExport("svg")}
                className={`${
                  active ? "bg-slate-600" : "bg-slate-700"
                } flex items-center w-full px-4 py-2 text-sm text-left whitespace-nowrap rounded-md`}
              >
                Export as SVG
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <button
                onClick={() => onExport("markdown")}
                className={`${
                  active ? "bg-slate-600" : "bg-slate-700"
                } flex items-center w-full px-4 py-2 text-sm text-left whitespace-nowrap rounded-md`}
              >
                Export as Markdown
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>
    </>
  );
}
