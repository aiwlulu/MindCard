"use client";

import React from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import {
  ChevronDownIcon,
  CodeFileIcon,
  DownloadIcon,
  FolderIcon,
  ImageIcon,
  MarkdownIcon,
  SaveIcon,
} from "./Icons";
import debounce from "@/lib/utils/debounce";
import type { MindmapExportFormat } from "@/lib/types";

interface MindmapActionsProps {
  onSave: () => void;
  onNavigateToMindmap: () => void;
  onExport: (format: MindmapExportFormat) => void;
}

const EXPORT_FORMATS: {
  format: MindmapExportFormat;
  label: string;
  hint: string;
  Icon: typeof ImageIcon;
}[] = [
  { format: "png", label: "Export as PNG", hint: "Image for slides and chat", Icon: ImageIcon },
  { format: "svg", label: "Export as SVG", hint: "Scalable vector", Icon: CodeFileIcon },
  { format: "markdown", label: "Export as Markdown", hint: "Outline text", Icon: MarkdownIcon },
];

export default function MindmapActions({
  onSave,
  onNavigateToMindmap,
  onExport,
}: MindmapActionsProps) {
  const debouncedSaveMindmap = debounce(() => {
    onSave();
  }, 300);

  return (
    <div className="nav-actions">
      <button
        type="button"
        onClick={onNavigateToMindmap}
        className="nav-button nav-button--ghost"
        aria-label="Library"
        title="Back to your mind maps"
      >
        <FolderIcon size={17} />
        <span className="nav-button-label">Library</span>
      </button>

      <Menu as="div" className="nav-menu">
        <MenuButton className="nav-button nav-button--ghost" aria-label="Export">
          <DownloadIcon size={17} />
          <span className="nav-button-label">Export</span>
          <ChevronDownIcon size={14} className="nav-button-caret" />
        </MenuButton>
        <MenuItems anchor="bottom end" className="menu-panel export-menu">
          {EXPORT_FORMATS.map(({ format, label, hint, Icon }) => (
            <MenuItem key={format}>
              <button
                type="button"
                className="menu-item menu-item--stacked"
                aria-label={label}
                onClick={() => onExport(format)}
              >
                <Icon size={16} />
                <span>
                  <span className="menu-item-title">{label}</span>
                  <span className="menu-item-hint">{hint}</span>
                </span>
              </button>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>

      <button
        type="button"
        onClick={debouncedSaveMindmap}
        className="nav-button nav-button--primary"
        aria-label="Save"
      >
        <SaveIcon size={17} />
        <span className="nav-button-label">Save</span>
      </button>
    </div>
  );
}
