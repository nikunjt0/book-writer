"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useWritingActivity } from "@/contexts/WritingActivityContext"

type Elem = "scene" | "character" | "dialogue" | "action" | "transition"

interface ScriptEditorProps {
  scene: { id: string; content: string }
  onChange: (s: { id: string; content: string }) => void
}

/* ───────── screenplay layout constants ───────── */
const DIALOGUE_INDENT = 20        // spaces in from the left edge
const DIALOGUE_WIDTH  = 35        // max visible chars per line (after indent)

export function ScriptEditor({ scene, onChange }: ScriptEditorProps) {
  const [content, setContent] = useState(scene.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { recordToday } = useWritingActivity()

  /* helpers -------------------------------------------------------------- */
  const pad = (n: number, str: string) => " ".repeat(n) + str
  const center80 = (str: string) =>
    pad(Math.max(0, Math.floor((80 - str.length) / 2)), str)
  const isDialogueLine = (line: string) =>
    line.startsWith(" ".repeat(DIALOGUE_INDENT))
  const centerCaret = (ta: HTMLTextAreaElement) => {
    const caret = ta.selectionStart
    const caretLine = ta.value.slice(0, caret).split("\n").length - 1
    const lineHeight =
      parseInt(getComputedStyle(ta).lineHeight || "20", 10) || 20
    const desiredTop =
      caretLine * lineHeight - ta.clientHeight / 2 + lineHeight / 2
  
    ta.scrollTop = Math.max(
      0,
      Math.min(desiredTop, ta.scrollHeight - ta.clientHeight),
    )
  }

  /** hard‑wrap a string to a width (breaks on word boundaries)           */
  const wrapText = (raw: string, width = DIALOGUE_WIDTH) => {
    const words = raw.split(" ")
    const lines: string[] = []
    let line = ""
    words.forEach((w) => {
      if ((line + w).length > width) {
        lines.push(line.trimEnd())
        line = ""
      }
      line += w + " "
    })
    if (line.trim()) lines.push(line.trimEnd())
    return lines
  }

  const autoWrapDialogue = (text: string) => {
    return text
      .split("\n")
      .flatMap((line) => {
        if (!isDialogueLine(line)) return [line]
  
        const body = line.slice(DIALOGUE_INDENT).trimEnd()
        if (body.length <= DIALOGUE_WIDTH) return [line]
  
        return wrapText(body, DIALOGUE_WIDTH).map((l) =>
          pad(DIALOGUE_INDENT, l),
        )
      })
      .join("\n")
  }

  /* snippet builder ------------------------------------------------------ */
  const buildSnippet = (kind: Elem) => {
    switch (kind) {
      case "scene":
        return { txt: `INT. LOCATION - DAY\n\n`, selStart: 5, selEnd: 13 }

      case "character": {
        const line = center80("CHARACTER NAME")
        const offset = line.indexOf("CHARACTER NAME")
        return { txt: `${line}\n\n`, selStart: offset, selEnd: offset + 14 }
      }

      case "dialogue": {
        const placeholder = "Dialogue goes here."
        const wrapped = wrapText(placeholder)
          .map((l) => pad(DIALOGUE_INDENT, l))
          .join("\n")
        return {
          txt: `${wrapped}\n\n`,
          selStart: DIALOGUE_INDENT,
          selEnd: DIALOGUE_INDENT + placeholder.length,
        }
      }

      case "action":
        return { txt: `Action description goes here.\n\n`, selStart: 0, selEnd: 28 }

      case "transition":
        return { txt: `${pad(51, "CUT TO:")}\n\n`, selStart: 51, selEnd: 58 }
    }
  }

  /* insertion handler ---------------------------------------------------- */
  const insertElement = (kind: Elem) => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const { selectionStart: start, selectionEnd: end } = ta
    const { txt, selStart, selEnd } = buildSnippet(kind)

    /* determine if current line is empty --------------------------------- */
    const before = content.slice(0, start)
    const lastNL = before.lastIndexOf("\n")
    const currentLine = before.slice(lastNL + 1) // "" if at start

    let prefix = ""
    if (!/^\s*$/.test(currentLine)) {
      // non‑empty line → break first
      prefix = kind === "dialogue" ? "\n" : "\n\n"
    }

    const newContent = content.slice(0, start) + prefix + txt + content.slice(end)
    setContent(newContent)
    onChange({ ...scene, content: newContent })

    /* place caret on placeholder ----------------------------------------- */
    requestAnimationFrame(() => {
        ta.focus()
        const base = start + prefix.length + selStart
        ta.setSelectionRange(base, base + (selEnd - selStart))
        centerCaret(ta)
      })
      
  }

  /* controlled textarea -------------------------------------------------- */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const ta = textareaRef.current
        const raw = e.target.value
        const caretBefore = ta ? ta.selectionStart : raw.length            // << NEW
    
        const formatted = autoWrapDialogue(raw)
    
        /* 2️⃣  if we inserted a wrap, adjust caret by the diff ------------------ */
        if (formatted !== raw) {
        const diff = formatted.length - raw.length                        // << NEW
        const caretAfter = caretBefore + diff                             // << NEW
    
        setContent(formatted)
        onChange({ ...scene, content: formatted })
    
        requestAnimationFrame(() => {
            if (ta) {
              ta.setSelectionRange(caretAfter, caretAfter)
              centerCaret(ta)                    
            }
          })
          
        } else {
        setContent(raw)
        onChange({ ...scene, content: raw })
        }
        recordToday()
    }

  return (
    <div className="font-mono" style={{ fontFamily: "Courier New, monospace" }}>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["scene", "action", "character", "dialogue", "transition"] as Elem[]).map(
          (k) => (
            <Button
              key={k}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => insertElement(k)}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </Button>
          ),
        )}
      </div>

      <textarea
        ref={textareaRef}
        id="script-textarea"
        value={content}
        onChange={handleChange}
        className="w-full h-[500px] border-0 p-0 resize-none focus:outline-none whitespace-pre-wrap"
        style={{ fontFamily: "Courier New, monospace" }}
      />
    </div>
  )
}
