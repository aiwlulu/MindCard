import type { NodeData } from "@/lib/types";
import {
  buildMindmapPng,
  buildMindmapSvg,
  convertToMarkdown,
  rasterizeSvgToPng,
  sanitizeFilename,
} from "./export";

const root: NodeData = {
  id: "root",
  topic: "A < Root >",
  children: [
    { id: "child", topic: "Child & detail", hyperLink: "map-2" },
    { id: "deep", topic: "Deep", children: [{ id: "leaf", topic: "Leaf" }] },
  ],
};

describe("mind map exports", () => {
  it("serializes nested topics as Markdown headings and lists", () => {
    expect(convertToMarkdown(root)).toBe(
      "# A < Root >\n## Child & detail\n## Deep\n### Leaf\n"
    );
  });

  it("keeps external URLs clickable in Markdown", () => {
    expect(
      convertToMarkdown({
        id: "reference",
        topic: "Reference",
        externalLink: "https://example.com/guide",
      })
    ).toBe("# [Reference](https://example.com/guide)\n");
  });

  it("serializes an escaped SVG with connectors and card links", () => {
    const svg = buildMindmapSvg(root);

    expect(svg).toContain("A &lt; Root &gt;");
    expect(svg).toContain("Child &amp; detail");
    expect(svg).toContain('href="/mindmap/map-2"');
    expect(svg).toContain("Open linked mind map");
    expect(svg).toContain('role="img"');
    expect(svg).toContain("path");
    expect(svg).toContain('stroke="#c98286"');
    expect(svg).toContain('stroke="#c99665"');
    expect(svg).toContain('stroke-width="3"');
    expect(svg).toContain('target="_blank"');
  });

  it("exports the visible canvas while keeping collapsed descendants in Markdown", () => {
    const collapsedRoot: NodeData = {
      id: "root",
      topic: "Root",
      children: [
        {
          id: "branch",
          topic: "Branch",
          collapsed: true,
          children: [
            {
              id: "hidden",
              topic: "Hidden",
              children: [{ id: "hidden-leaf", topic: "Hidden leaf" }],
            },
          ],
        },
      ],
    };

    expect(buildMindmapSvg(collapsedRoot)).not.toContain("Hidden");
    expect(buildMindmapSvg(collapsedRoot)).toContain(">+2</text>");
    expect(convertToMarkdown(collapsedRoot)).toContain("### Hidden");
  });

  it("rasterizes a high-resolution PNG from the complete SVG", async () => {
    const drawImage = jest.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => ({ drawImage })),
      toBlob: jest.fn((callback: BlobCallback) =>
        callback(new Blob(["png"], { type: "image/png" }))
      ),
    } as unknown as HTMLCanvasElement;
    const originalCreateElement = document.createElement.bind(document);
    const createElement = jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) =>
        tagName === "canvas"
          ? canvas
          : originalCreateElement(tagName)) as typeof document.createElement);
    const originalImage = globalThis.Image;
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;

    class LoadedImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: LoadedImage,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:mindmap"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });

    try {
      const png = await buildMindmapPng(root);

      expect(png.type).toBe("image/png");
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
      expect(drawImage).toHaveBeenCalled();
    } finally {
      createElement.mockRestore();
      Object.defineProperty(globalThis, "Image", {
        configurable: true,
        value: originalImage,
      });
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectUrl,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectUrl,
      });
    }
  });

  it("caps very large PNG canvases at a browser-safe dimension", async () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => ({ drawImage: jest.fn() })),
      toBlob: jest.fn((callback: BlobCallback) =>
        callback(new Blob(["png"], { type: "image/png" }))
      ),
    } as unknown as HTMLCanvasElement;
    const originalCreateElement = document.createElement.bind(document);
    const createElement = jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) =>
        tagName === "canvas"
          ? canvas
          : originalCreateElement(tagName)) as typeof document.createElement);
    const originalImage = globalThis.Image;
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;

    class LoadedImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    Object.defineProperty(globalThis, "Image", {
      configurable: true,
      value: LoadedImage,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn(() => "blob:mindmap"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });

    try {
      await rasterizeSvgToPng("<svg/>", 10_000, 2_000, 2);

      expect(canvas.width).toBe(16_384);
      expect(canvas.height).toBe(3_277);
    } finally {
      createElement.mockRestore();
      Object.defineProperty(globalThis, "Image", {
        configurable: true,
        value: originalImage,
      });
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectUrl,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectUrl,
      });
    }
  });

  it("sanitizes a downloaded filename", () => {
    expect(sanitizeFilename('a:/bad*title? "map"')).toBe("a_bad_title_map");
  });
});
