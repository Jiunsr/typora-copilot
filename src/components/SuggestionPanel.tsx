import * as path from "@modules/path";

import { render } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { COPILOT_ICON_PATHNAME } from "@/constants";
import { File } from "@/typora-utils";
import { getCaretCoordinate } from "@/utils/dom";
import { css, registerCSS } from "@/utils/tools";

registerCSS(css`
  .suggestion-panel {
    position: absolute;
    z-index: 9999;
    pointer-events: none;
    white-space: pre-wrap;
    border: 1px solid #B2B2B2;
    display: flex;
    flex-direction: column;
    padding: 8px;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  .CodeMirror-line{
    line-height: initial;
  }
`);

export interface SuggestionPanelProps {
  x: number;
  y: number;
  text: string;
  textColor?: string;
}

/**
 * Create and attach a suggestion panel to the DOM. The element is placed right below caret.
 * @param text The text to be displayed in the suggestion panel.
 * @returns A function that can be used to remove the suggestion panel from the DOM.
 */
export const attachSuggestionPanel = (text: string) => {
  const pos = getCaretCoordinate();
  if (!pos) return () => {};

  const container = document.createElement("div");
  document.body.appendChild(container);

  const { x, y } = pos;
  render(<SuggestionPanel x={x} y={y} text={text} />, container);

  // Adjust position when scrolling
  const scrollListener = () => {
    const pos = getCaretCoordinate();
    if (!pos) return;
    $(".suggestion-panel").css("top", `calc(${pos.y}px + 1.5em)`);
  };
  $("content").on("scroll", scrollListener);

  return () => {
    $("content").off("scroll", scrollListener);
    render(null, container);
    container.remove();
  };
};

/**
 * A suggestion panel that displays the text generated by Copilot.
 * @returns
 */
const SuggestionPanel: FC<SuggestionPanelProps> = ({ text, textColor = "gray", x, y }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const codeAreaRef = useRef<HTMLTextAreaElement>(null);

  const maxAvailableWidth =
    File.editor!.writingArea.getBoundingClientRect().width -
    (x - File.editor!.writingArea.getBoundingClientRect().left) -
    30;

  const copilotIconPosixPathname = path.posix.join(...COPILOT_ICON_PATHNAME.NORMAL.split(path.sep));

  // Calculate actual width after mount, and adjust position
  useEffect(() => {
    const actualWidth = containerRef.current!.getBoundingClientRect().width;
    containerRef.current!.style.left = `min(${x}px, calc(${x}px + ${maxAvailableWidth}px - ${actualWidth}px))`;

    // Highlight markdown syntax using CodeMirror
    const cm = CodeMirror.fromTextArea(codeAreaRef.current!, {
      lineWrapping: true,
      mode: "gfm",
      theme: "typora-default",
      maxHighlightLength: Infinity,
      // @ts-expect-error - Extracted from Typora. I don't really know if this prop is used,
      // but to be safe, I just keep it like original
      styleActiveLine: true,
      visibleSpace: true,
      autoCloseTags: true,
      resetSelectionOnContextMenu: false,
      lineNumbers: false,
      dragDrop: false,
    });

    // Adjust cm styles
    const bodyBackgroundColor = window.getComputedStyle(document.body).backgroundColor;
    codeAreaRef.current!.style.backgroundColor = bodyBackgroundColor;
    cm.getWrapperElement().style.backgroundColor = bodyBackgroundColor;
    cm.getWrapperElement().style.padding = "0";
    $(cm.getWrapperElement()).find(".CodeMirror-hscrollbar").remove();
    $(cm.getWrapperElement()).children().css("backgroundColor", bodyBackgroundColor);
    $(cm.getWrapperElement()).find(".CodeMirror-activeline-background").remove();

    // Set visibility to visible
    containerRef.current!.style.removeProperty("visibility");
  }, []);

  return (
    <div
      ref={containerRef}
      className="suggestion-panel"
      style={{
        // Visibility is set to hidden on mount to adjust position after calculating actual width,
        // and then set to visible
        visibility: "hidden",
        left: 0,
        top: `calc(${y}px + 1.5em)`,
        maxWidth: `min(80ch, max(40ch, ${maxAvailableWidth}px))`,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        color: window.getComputedStyle(document.body).color,
      }}>
      <textarea ref={codeAreaRef} style={{ padding: 0 }} value={text} />
      <div
        style={{
          color: textColor,
          marginTop: "0.25em",
          marginLeft: "0.25em",
          display: "none",
          flexDirection: "row",
          alignItems: "center",
        }}>
        <div
          style={{
            marginRight: "0.4em",
            height: "1em",
            width: "1em",
            backgroundColor: textColor,
            webkitMaskImage: `url('${copilotIconPosixPathname}')`,
            maskImage: `url('${copilotIconPosixPathname}')`,
            webkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            webkitMaskPosition: "center",
            maskPosition: "center",
            webkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        <span style={{ marginRight: "0.25em" }}>Generated by GitHub Copilot</span>
      </div>
    </div>
  );
};

export default SuggestionPanel;