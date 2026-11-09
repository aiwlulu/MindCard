import React from "react";

// Lucide-style 24x24 stroke icons rendered inline so no icon font is needed.

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
  "data-icon"?: string;
}

type IconDefinition = React.ReactNode;

function createIcon(name: string, children: IconDefinition, defaultSize = 18) {
  function Icon({
    size = defaultSize,
    className = "",
    strokeWidth = 1.75,
    onClick,
    ...rest
  }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        data-icon={rest["data-icon"] ?? name}
        onClick={onClick}
      >
        {children}
      </svg>
    );
  }
  Icon.displayName = `${name}Icon`;
  return Icon;
}

export const SaveIcon = createIcon(
  "save",
  <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </>,
  20
);

export const FolderIcon = createIcon(
  "folder",
  <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  20
);

export const DownloadIcon = createIcon(
  "download",
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </>,
  20
);

export const LogoutIcon = createIcon(
  "logout",
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>,
  20
);

export const TrashIcon = createIcon(
  "trash",
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>
);

export const ClearIcon = createIcon(
  "x",
  <>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </>,
  16
);

export const InfoIcon = createIcon(
  "info",
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </>,
  24
);

export const EyeIcon = createIcon(
  "eye",
  <>
    <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.42 8.3 7.3 5 12 5s8.58 3.3 9.94 6.65a1 1 0 0 1 0 .7C20.58 15.7 16.7 19 12 19s-8.58-3.3-9.94-6.65Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
  16
);

export const EyeOffIcon = createIcon(
  "eye-off",
  <>
    <path d="M3 3 21 21" />
    <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-3.13 3.82" />
    <path d="M6.53 6.53A21.24 21.24 0 0 0 1 12s4 7 11 7a10.9 10.9 0 0 0 5.47-1.47" />
  </>,
  16
);

export const PanIcon = createIcon(
  "pan",
  <>
    <path d="M18 11V6a2 2 0 0 0-4 0" />
    <path d="M14 10V4a2 2 0 0 0-4 0v2" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </>
);

export const SunIcon = createIcon(
  "sun",
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>
);

export const MoonIcon = createIcon(
  "moon",
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
);

export const MonitorIcon = createIcon(
  "monitor",
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </>
);

export const PlusIcon = createIcon(
  "plus",
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>
);

export const UndoIcon = createIcon(
  "undo",
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
  </>
);

export const RedoIcon = createIcon(
  "redo",
  <>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
  </>
);

export const PencilIcon = createIcon(
  "pencil",
  <>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </>
);

export const ChildIcon = createIcon(
  "corner-down-right",
  <>
    <path d="m15 10 5 5-5 5" />
    <path d="M4 4v7a4 4 0 0 0 4 4h12" />
  </>
);

export const SiblingIcon = createIcon(
  "list-plus",
  <>
    <path d="M11 12H3" />
    <path d="M16 6H3" />
    <path d="M16 18H3" />
    <path d="M18 9v6" />
    <path d="M21 12h-6" />
  </>
);

export const CollapseIcon = createIcon(
  "chevrons-down-up",
  <>
    <path d="m7 20 5-5 5 5" />
    <path d="m7 4 5 5 5-5" />
  </>
);

export const ExpandIcon = createIcon(
  "chevrons-up-down",
  <>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </>
);

export const LinkIcon = createIcon(
  "link",
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>
);

export const UnlinkIcon = createIcon(
  "unlink",
  <>
    <path d="M9 17H7A5 5 0 0 1 7 7" />
    <path d="M15 7h2a5 5 0 0 1 4 8" />
    <path d="M8 12h4" />
    <path d="m2 2 20 20" />
  </>
);

export const MoreIcon = createIcon(
  "more",
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>
);

export const ZoomInIcon = createIcon(
  "zoom-in",
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M11 8v6" />
    <path d="M8 11h6" />
  </>
);

export const ZoomOutIcon = createIcon(
  "zoom-out",
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M8 11h6" />
  </>
);

export const FitIcon = createIcon(
  "fit",
  <>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    <circle cx="12" cy="12" r="2.5" />
  </>
);

export const FullscreenIcon = createIcon(
  "fullscreen",
  <>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </>
);

export const ExitFullscreenIcon = createIcon(
  "exit-fullscreen",
  <>
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </>
);

export const SearchIcon = createIcon(
  "search",
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>
);

export const GlobeIcon = createIcon(
  "globe",
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </>
);

export const LockIcon = createIcon(
  "lock",
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
);

export const CopyIcon = createIcon(
  "copy",
  <>
    <rect x="8" y="8" width="14" height="14" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>
);

export const ShareIcon = createIcon(
  "share",
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.59 13.51 6.83 3.98" />
    <path d="m15.41 6.51-6.82 3.98" />
  </>
);

export const KeyboardIcon = createIcon(
  "keyboard",
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
    <path d="M7 16h10" />
  </>
);

export const LayersIcon = createIcon(
  "layers",
  <>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
    <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
  </>
);

export const CheckIcon = createIcon("check", <path d="M20 6 9 17l-5-5" />);

export const ChevronDownIcon = createIcon("chevron-down", <path d="m6 9 6 6 6-6" />);

export const ChevronRightIcon = createIcon(
  "chevron-right",
  <path d="m9 18 6-6-6-6" />
);

export const ArrowLeftIcon = createIcon(
  "arrow-left",
  <>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </>
);

export const ArrowRightIcon = createIcon(
  "arrow-right",
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>
);

export const FocusIcon = createIcon(
  "focus",
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
  </>
);

export const ExternalLinkIcon = createIcon(
  "external-link",
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>
);

export const MarkdownIcon = createIcon(
  "markdown",
  <>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </>
);

export const SplitIcon = createIcon(
  "split",
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 3v18" />
  </>
);

export const MapIcon = createIcon(
  "map",
  <>
    <circle cx="5" cy="12" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M7.5 12h3a3 3 0 0 0 3-3V8a2 2 0 0 1 2-2h0" />
    <path d="M7.5 12h3a3 3 0 0 1 3 3v1a2 2 0 0 0 2 2h0" />
  </>
);

export const ImageIcon = createIcon(
  "image",
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </>
);

export const CodeFileIcon = createIcon(
  "code-file",
  <>
    <path d="M10 12.5 8 15l2 2.5" />
    <path d="m14 12.5 2 2.5-2 2.5" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
  </>
);

export const UserIcon = createIcon(
  "user",
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

export const PointerIcon = createIcon(
  "pointer",
  <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
);

export const ClockIcon = createIcon(
  "clock",
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>
);

export const SparkIcon = createIcon(
  "spark",
  <>
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="m5.6 5.6 2.1 2.1" />
    <path d="m16.3 16.3 2.1 2.1" />
    <path d="m5.6 18.4 2.1-2.1" />
    <path d="m16.3 7.7 2.1-2.1" />
  </>
);

export const GoogleIcon = ({ size = 16, className = "" }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.55-5.17 3.55-8.87Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3a7.2 7.2 0 0 1-10.73-3.78H1.34v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.34 14.31a7.22 7.22 0 0 1 0-4.6V6.62H1.34a12 12 0 0 0 0 10.78l4-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.96 11.96 0 0 0 1.34 6.62l4 3.09A7.16 7.16 0 0 1 12 4.75Z"
    />
  </svg>
);
