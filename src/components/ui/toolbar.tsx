"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Link,
  Heading,
  Quote,
  List,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Underline,
  Strikethrough,
  Unlink,
  Check,
  X,
  Undo,
  Redo,
} from "lucide-react";
import React, { useState, useRef } from "react";
import { isUrlLike, normalizeUrl } from "../../lib/editor-utils";

const ToolbarButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  onMouseDown,
  tooltip,
  showTooltip,
  hideTooltip,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  tooltip: string | null;
  showTooltip: (label: string) => void;
  hideTooltip: () => void;
}) => (
  <div
    className="relative"
    onMouseEnter={() => showTooltip(label)}
    onMouseLeave={hideTooltip}
  >
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (onMouseDown) onMouseDown(e);
      }}
      className={`h-8 w-8 flex items-center justify-center rounded-md transition-colors duration-200 ${
        isActive ? "bg-blue-50 text-[#0068f9] ring-1 ring-[#0068f9]/20" : "text-[#4b5563]"
      } hover:bg-slate-100 hover:text-[#121722] focus:outline-none cursor-pointer`}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </button>
    {tooltip === label && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-nowrap font-medium absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg pointer-events-none z-50"
      >
        {label}
      </motion.div>
    )}
  </div>
);

export interface ToolbarProps {
  className?: string;
  textAlign?: "left" | "center" | "right";
  onTextAlignChange?: (align: "left" | "center" | "right") => void;
  onAction?: (action: string, value?: string) => void;
  activeButtons?: string[];
  onToggleActiveButton?: (button: string) => void;
}

const COLOR_OPTIONS = [
  { name: 'Brand Blue', hex: '#0068f9' },
  { name: 'Dark Slate', hex: '#0f172a' },
  { name: 'Muted Gray', hex: '#64748b' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Crimson', hex: '#e11d48' },
  { name: 'Purple', hex: '#7c3aed' },
];

const Toolbar = ({
  className,
  textAlign: externalTextAlign,
  onTextAlignChange,
  onAction,
  activeButtons: externalActiveButtons,
  onToggleActiveButton,
}: ToolbarProps = {}) => {
  const [internalTextAlign, setInternalTextAlign] = useState<"left" | "center" | "right">(
    "left"
  );
  const [internalActiveButtons, setInternalActiveButtons] = useState<string[]>([]);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const textAlign = externalTextAlign ?? internalTextAlign;
  const activeButtons = externalActiveButtons ?? internalActiveButtons;

  const toggleActiveButton = (button: string, value?: string) => {
    if (onToggleActiveButton) {
      onToggleActiveButton(button);
    } else {
      setInternalActiveButtons((prev) =>
        prev.includes(button)
          ? prev.filter((b) => b !== button)
          : [...prev, button]
      );
    }
    if (onAction) {
      onAction(button, value);
    }
  };

  const handleLinkButtonClick = () => {
    setShowColorPalette(false);
    const sel = window.getSelection();
    const rawText = sel ? sel.toString() : "";
    const selectedText = rawText.trim();

    // Check if cursor or selection is currently inside an existing anchor
    let existingAnchor: HTMLAnchorElement | null = null;
    let existingHref = "";
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.anchorNode;
      while (node) {
        if (node.nodeName === "A") {
          existingAnchor = node as HTMLAnchorElement;
          existingHref =
            (node as HTMLAnchorElement).getAttribute("href") ||
            (node as HTMLAnchorElement).href ||
            "";
          break;
        }
        node = node.parentNode;
      }
    }

    // If text already has link effect / cursor is inside a link, clicking link button toggles it off and removes the link effect!
    if (activeButtons.includes("link") || existingAnchor || existingHref) {
      toggleActiveButton("unlink");
      setShowLinkPopover(false);
      setLinkInputUrl("");
      return;
    }

    // 1. If user selected text formatted like a link (e.g., https://pofeiportfolio.vercel.app/ or pofeiportfolio.vercel.app)
    if (isUrlLike(selectedText)) {
      const cleanUrl = normalizeUrl(selectedText);
      toggleActiveButton("link", cleanUrl);
      setShowLinkPopover(false);
      return;
    }

    // 2. Save range for popover use
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0).cloneRange());
    }

    setLinkInputUrl(selectedText ? "" : "https://");
    setShowLinkPopover((prev) => !prev);
    setTimeout(() => linkInputRef.current?.focus(), 60);
  };

  const handleApplyLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }
    if (linkInputUrl.trim()) {
      const cleanUrl = normalizeUrl(linkInputUrl.trim());
      toggleActiveButton("link", cleanUrl);
    }
    setShowLinkPopover(false);
    setLinkInputUrl("");
  };

  const handleUnlink = () => {
    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }
    toggleActiveButton("unlink");
    setShowLinkPopover(false);
    setLinkInputUrl("");
  };

  const handleAlign = (align: "left" | "center" | "right") => {
    if (onTextAlignChange) {
      onTextAlignChange(align);
    } else {
      setInternalTextAlign(align);
    }
    if (onAction) {
      onAction(`align-${align}`);
    }
  };

  const showTooltip = (label: string) => {
    setTooltip(label);
  };

  const hideTooltip = () => setTooltip(null);

  const isEmbedded = Boolean(className);

  return (
    <div className={className || "relative w-full min-h-[300px] flex items-center justify-center rounded-lg p-6"}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`${
            isEmbedded ? "relative" : "absolute"
          } z-30 bg-white rounded-lg shadow-sm border border-slate-200/80 flex items-center gap-1 p-1`}
        >
          {/* Text Formatting Section */}
          <ToolbarButton
            label="Bold"
            icon={Bold}
            isActive={activeButtons.includes("bold")}
            onClick={() => toggleActiveButton("bold")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Italic"
            icon={Italic}
            isActive={activeButtons.includes("italic")}
            onClick={() => toggleActiveButton("italic")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Underline"
            icon={Underline}
            isActive={activeButtons.includes("underline")}
            onClick={() => toggleActiveButton("underline")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Strikethrough"
            icon={Strikethrough}
            isActive={activeButtons.includes("strikethrough")}
            onClick={() => toggleActiveButton("strikethrough")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <div className="relative">
            <ToolbarButton
              label={activeButtons.includes("link") ? "Edit Link" : "Link"}
              icon={Link}
              isActive={activeButtons.includes("link") || showLinkPopover}
              onClick={handleLinkButtonClick}
              tooltip={tooltip}
              showTooltip={showTooltip}
              hideTooltip={hideTooltip}
            />

            {/* Link Popover for custom URL entry or edit */}
            {showLinkPopover && (
              <div
                className="absolute top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-xl p-2.5 z-50 flex flex-col gap-2 min-w-[280px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-semibold text-slate-700 pb-1 border-b border-slate-100">
                  <span>{activeButtons.includes("link") ? "Edit Link" : "Insert Link"}</span>
                  <button
                    type="button"
                    onClick={() => setShowLinkPopover(false)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <form onSubmit={handleApplyLink} className="flex flex-col gap-2">
                  <input
                    ref={linkInputRef}
                    type="text"
                    value={linkInputUrl}
                    onChange={(e) => setLinkInputUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0068f9] text-slate-800"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {activeButtons.includes("link") && (
                      <button
                        type="button"
                        onClick={handleUnlink}
                        className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Unlink className="w-3 h-3" />
                        Remove
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setShowLinkPopover(false)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-[11px] font-semibold text-white bg-[#0068f9] hover:bg-[#0052c2] rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Apply
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
          <ToolbarButton
            label="Heading"
            icon={Heading}
            isActive={activeButtons.includes("heading")}
            onClick={() => toggleActiveButton("heading")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Quote"
            icon={Quote}
            isActive={activeButtons.includes("quote")}
            onClick={() => toggleActiveButton("quote")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Bullet List"
            icon={List}
            isActive={activeButtons.includes("bullet") || activeButtons.includes("list")}
            onClick={() => toggleActiveButton("bullet")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5"></div>

          {/* Highlight and Color Section */}
          <ToolbarButton
            label="Highlight"
            icon={Highlighter}
            isActive={activeButtons.includes("highlight")}
            onClick={() => toggleActiveButton("highlight")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />

          <div className="relative">
            <ToolbarButton
              label="Text Color"
              icon={Palette}
              isActive={activeButtons.includes("color") || showColorPalette}
              onClick={() => setShowColorPalette((prev) => !prev)}
              tooltip={tooltip}
              showTooltip={showTooltip}
              hideTooltip={hideTooltip}
            />

            {/* Color Palette Popover */}
            {showColorPalette && (
              <div 
                className="absolute top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-50 flex items-center gap-1.5"
                onMouseDown={(e) => e.preventDefault()}
              >
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleActiveButton("color", c.hex);
                      setShowColorPalette(false);
                    }}
                    className="w-5 h-5 rounded-full border border-black/10 hover:scale-125 transition-transform cursor-pointer"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5"></div>

          {/* Text Alignment Section */}
          <ToolbarButton
            label="Align Left"
            icon={AlignLeft}
            isActive={textAlign === "left"}
            onClick={() => handleAlign("left")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Align Center"
            icon={AlignCenter}
            isActive={textAlign === "center"}
            onClick={() => handleAlign("center")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Align Right"
            icon={AlignRight}
            isActive={textAlign === "right"}
            onClick={() => handleAlign("right")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-0.5"></div>

          {/* History (Undo / Redo) Section */}
          <ToolbarButton
            label="Undo"
            icon={Undo}
            isActive={false}
            onClick={() => toggleActiveButton("undo")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
          <ToolbarButton
            label="Redo"
            icon={Redo}
            isActive={false}
            onClick={() => toggleActiveButton("redo")}
            tooltip={tooltip}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export { Toolbar };
export default Toolbar;
