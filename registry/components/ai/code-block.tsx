"use client"

import * as React from "react"
import { Check, Copy, FileCode2, WrapText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/goodui-locale"
import { GooduiTokens } from "@/lib/goodui-motion"

/*
 * Code block with a small hand-written tokenizer (TypeScript/JS/JSX, JSON, bash, Python, CSS, HTML, SQL, YAML),
 * or pre-tokenized lines from your own highlighter (shiki, prism). Token colors are derived from the theme's
 * --chart-1..5 so they follow the buyer's palette and stay readable in light and dark.
 */

export type CodeTokenType = "plain" | "keyword" | "string" | "number" | "comment" | "function" | "type" | "property" | "punctuation" | "operator" | "tag" | "attr" | "variable" | "constant"
export type CodeToken = { content: string; type: CodeTokenType }
export type CodeLanguage = "ts" | "tsx" | "js" | "jsx" | "json" | "bash" | "sh" | "python" | "py" | "css" | "html" | "sql" | "yaml" | "yml" | "text"

type Family = "js" | "json" | "bash" | "py" | "css" | "html" | "sql" | "yaml" | "text"
const FAMILY: Record<CodeLanguage, Family> = { ts: "js", tsx: "js", js: "js", jsx: "js", json: "json", bash: "bash", sh: "bash", python: "py", py: "py", css: "css", html: "html", sql: "sql", yaml: "yaml", yml: "yaml", text: "text" }

const words = (s: string) => new Set(s.split(" "))
const KEYWORDS: Partial<Record<Family, Set<string>>> = {
  js: words(
    "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends finally for from function if implements import in instanceof interface is keyof let namespace new of package private protected public readonly return satisfies static super switch this throw try type typeof var void while with yield",
  ),
  py: words("and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield self"),
  bash: words("if then else elif fi for in do done while until case esac function return exit export source local set unset readonly shift break continue"),
  sql: words(
    "select from where and or not null is in as on join left right inner outer full group by order limit offset insert into values update set delete create table primary key index drop alter add having union all distinct case when then else end between like exists returning with asc desc",
  ),
}
const CONSTANTS = words("true false null undefined None True False NaN Infinity")

type Rule = { re: RegExp; type: CodeTokenType; open?: string }
const R = (src: string, type: CodeTokenType, open?: string, flags = ""): Rule => ({ re: new RegExp(src, "y" + flags), type, open })
const LINE_COMMENT = R("\\/\\/.*", "comment")
const HASH_COMMENT = R("#.*", "comment")
const BLOCK_COMMENT = [R("\\/\\*[\\s\\S]*?\\*\\/", "comment"), R("\\/\\*.*", "comment", "*/")]
const DQ = R('"(?:\\\\.|[^"\\\\])*"?', "string")
const SQ = R("'(?:\\\\.|[^'\\\\])*'?", "string")
const NUMBER = R("0x[\\da-f]+(?!\\w)|\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?(?:px|em|rem|vh|vw|vmin|vmax|ms|s|deg|fr|ch|%)?(?!\\w)", "number", undefined, "i")
const WORD = R("[A-Za-z_$][\\w$]*", "plain")
const SPACE = R("\\s+", "plain")
const PUNCT = R("[{}()\\[\\].,;]", "punctuation")
const OPERATOR = R("[+\\-*/%=<>!&|^~?:@]+", "operator")
const ANY = R("[\\s\\S]", "plain")

const RULES: Record<Family, Rule[]> = {
  js: [LINE_COMMENT, ...BLOCK_COMMENT, DQ, SQ, R("`(?:\\\\.|[^`\\\\])*`", "string"), R("`.*", "string", "`"), NUMBER, WORD, SPACE, PUNCT, OPERATOR, ANY],
  json: [DQ, NUMBER, WORD, SPACE, PUNCT, OPERATOR, ANY],
  bash: [HASH_COMMENT, DQ, SQ, R("\\$\\{[^}]*\\}|\\$[\\w@#?*]+", "variable"), R("--?[\\w-]+", "attr"), NUMBER, WORD, SPACE, R("[|&;<>()]+", "punctuation"), ANY],
  py: [HASH_COMMENT, R('"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'', "string"), R('""".*', "string", '"""'), DQ, SQ, R("@[\\w.]+", "attr"), NUMBER, WORD, SPACE, PUNCT, OPERATOR, ANY],
  css: [...BLOCK_COMMENT, DQ, SQ, R("@[\\w-]+", "keyword"), R("!important", "keyword"), R("#[\\da-f]{3,8}\\b", "number", undefined, "i"), NUMBER, R("[\\w-]+(?=\\()", "function"), R("::?[\\w-]+", "attr"), R("[.#]?[A-Za-z_-][\\w-]*", "plain"), SPACE, PUNCT, OPERATOR, ANY],
  html: [R("<!--[\\s\\S]*?-->", "comment"), R("<!--.*", "comment", "-->"), R("<!DOCTYPE[^>]*>", "keyword", undefined, "i"), R("<\\/?", "punctuation"), SPACE, R("[^<\\s][^<]*", "plain"), ANY],
  sql: [R("--.*", "comment"), ...BLOCK_COMMENT, SQ, DQ, NUMBER, WORD, SPACE, PUNCT, OPERATOR, ANY],
  yaml: [HASH_COMMENT, DQ, SQ, R("[&*][\\w-]+", "variable"), R("^\\s*-(?=\\s)", "punctuation"), NUMBER, R("[\\w.-]+(?=\\s*:(?:\\s|$))", "property"), WORD, SPACE, R("[:\\[\\]{},|>-]", "punctuation"), ANY],
  text: [],
}
const TAG_RULES: Rule[] = [SPACE, R("\\/?>", "punctuation"), DQ, SQ, R("=", "operator"), R("[\\w:.-]+", "attr"), ANY]

type ScanState = { open: string | null; tag: boolean; brace: boolean }

function classify(word: string, fam: Family, line: string, start: number, end: number, st: ScanState): CodeTokenType {
  if (CONSTANTS.has(word)) return "constant"
  if (fam === "css") {
    if (st.brace && /^\s*:/.test(line.slice(end)) && !/[.#]/.test(word[0] ?? "")) return "property"
    return st.brace ? "plain" : "tag"
  }
  if (fam === "json" || fam === "yaml") return "plain"
  const next = line.slice(end)
  const prev = line.slice(0, start)
  if (KEYWORDS[fam]?.has(fam === "sql" ? word.toLowerCase() : word)) return "keyword"
  if (fam === "js" && (prev.endsWith("<") || prev.endsWith("</"))) return "tag"
  if (/^\s*\(/.test(next)) return "function"
  if (fam === "bash") return /^\s*$/.test(prev) || /(?:[|;&]|&&|\|\||\bthen|\bdo)\s*$/.test(prev) ? "function" : "plain"
  if (fam === "js" && prev.endsWith(".")) return "property"
  if ((fam === "js" || fam === "py") && /^[A-Z]/.test(word) && !/^[A-Z0-9_]+$/.test(word)) return "type"
  if (fam === "js" && /^[A-Z][A-Z0-9_]+$/.test(word)) return "constant"
  return "plain"
}

function tokenizeLine(line: string, fam: Family, st: ScanState): CodeToken[] {
  const out: CodeToken[] = []
  const push = (content: string, type: CodeTokenType) => {
    if (!content) return
    const last = out[out.length - 1]
    if (last && last.type === type) last.content += content
    else out.push({ content, type })
  }
  if (fam === "text") {
    push(line, "plain")
    return out
  }
  let i = 0
  while (i < line.length) {
    // Inside a block comment, a template literal or a triple-quoted string from an earlier line.
    if (st.open) {
      const end = line.indexOf(st.open, i)
      const type: CodeTokenType = st.open === "*/" || st.open === "-->" ? "comment" : "string"
      if (end === -1) {
        push(line.slice(i), type)
        i = line.length
      } else {
        push(line.slice(i, end + st.open.length), type)
        i = end + st.open.length
        st.open = null
      }
      continue
    }
    const rules = fam === "html" && st.tag ? TAG_RULES : RULES[fam]
    let matched = false
    for (const rule of rules) {
      rule.re.lastIndex = i
      const m = rule.re.exec(line)
      if (!m || !m[0]) continue
      const text = m[0]
      let type = rule.type
      if (rule === WORD || (fam === "css" && rule.type === "plain" && rule !== SPACE && rule !== ANY)) type = classify(text, fam, line, i, i + text.length, st)
      else if (fam === "json" && rule === DQ && /^\s*:/.test(line.slice(i + text.length))) type = "property"
      else if (fam === "html" && rule.re.source === "<\\/?") {
        push(text, "punctuation")
        const name = /[\w:-]+/y
        name.lastIndex = i + text.length
        const nm = name.exec(line)
        if (nm) push(nm[0], "tag")
        i += text.length + (nm?.[0].length ?? 0)
        st.tag = true
        matched = true
        break
      }
      if (fam === "css" && text === "{") st.brace = true
      if (fam === "css" && text === "}") st.brace = false
      if (fam === "html" && st.tag && text.endsWith(">")) st.tag = false
      push(text, type)
      if (rule.open) st.open = rule.open
      i += text.length
      matched = true
      break
    }
    if (!matched) {
      push(line[i] ?? "", "plain")
      i++
    }
  }
  return out
}

/** Splits code into lines of colored tokens. Exported so other components (diffs, messages) can reuse it. */
export function tokenizeCode(code: string, language: CodeLanguage = "text"): CodeToken[][] {
  const fam = FAMILY[language] ?? "text"
  const st: ScanState = { open: null, tag: false, brace: false }
  return code.replace(/\r\n?/g, "\n").split("\n").map((line) => tokenizeLine(line, fam, st))
}

/** Renders one line of tokens as colored spans (inside a `.pc-code` element for the colors to apply). */
export function CodeTokens({ tokens }: { tokens: CodeToken[] }) {
  return (
    <>
      {tokens.map((t, i) =>
        t.type === "plain" ? (
          <React.Fragment key={i}>{t.content}</React.Fragment>
        ) : (
          <span key={i} data-t={t.type}>
            {t.content}
          </span>
        ),
      )}
    </>
  )
}

/** Token color rules; other components that render CodeTokens ship this with the same href so it is loaded once. */
export const CODE_CSS = `
.pc-code{--pc-code-kw:color-mix(in oklab,var(--chart-4) 62%,var(--foreground));--pc-code-str:color-mix(in oklab,var(--chart-2) 50%,var(--foreground));--pc-code-num:color-mix(in oklab,var(--chart-3) 42%,var(--foreground));--pc-code-fn:color-mix(in oklab,var(--chart-1) 66%,var(--foreground));--pc-code-type:color-mix(in oklab,var(--chart-5) 56%,var(--foreground));--pc-code-prop:color-mix(in oklab,var(--chart-1) 52%,var(--foreground));--pc-code-tag:color-mix(in oklab,var(--chart-5) 60%,var(--foreground));--pc-code-attr:color-mix(in oklab,var(--chart-3) 42%,var(--foreground));--pc-code-var:color-mix(in oklab,var(--chart-2) 45%,var(--foreground));--pc-code-const:color-mix(in oklab,var(--chart-3) 45%,var(--foreground));--pc-code-punct:color-mix(in oklab,var(--foreground) 62%,var(--muted-foreground));--pc-code-op:color-mix(in oklab,var(--chart-1) 40%,var(--foreground));--pc-code-comment:var(--muted-foreground)}
.dark .pc-code{--pc-code-kw:color-mix(in oklab,var(--chart-4) 82%,var(--foreground));--pc-code-str:color-mix(in oklab,var(--chart-2) 85%,var(--foreground));--pc-code-num:color-mix(in oklab,var(--chart-3) 85%,var(--foreground));--pc-code-fn:color-mix(in oklab,var(--chart-1) 85%,var(--foreground));--pc-code-type:color-mix(in oklab,var(--chart-5) 80%,var(--foreground));--pc-code-prop:color-mix(in oklab,var(--chart-1) 70%,var(--foreground));--pc-code-tag:color-mix(in oklab,var(--chart-5) 85%,var(--foreground));--pc-code-attr:color-mix(in oklab,var(--chart-3) 80%,var(--foreground));--pc-code-var:color-mix(in oklab,var(--chart-2) 75%,var(--foreground));--pc-code-const:color-mix(in oklab,var(--chart-3) 80%,var(--foreground));--pc-code-punct:color-mix(in oklab,var(--foreground) 70%,var(--muted-foreground));--pc-code-op:color-mix(in oklab,var(--chart-1) 60%,var(--foreground))}
.pc-code [data-t=keyword]{color:var(--pc-code-kw)}
.pc-code [data-t=string]{color:var(--pc-code-str)}
.pc-code [data-t=number]{color:var(--pc-code-num)}
.pc-code [data-t=function]{color:var(--pc-code-fn)}
.pc-code [data-t=type]{color:var(--pc-code-type)}
.pc-code [data-t=property]{color:var(--pc-code-prop)}
.pc-code [data-t=tag]{color:var(--pc-code-tag)}
.pc-code [data-t=attr]{color:var(--pc-code-attr)}
.pc-code [data-t=variable]{color:var(--pc-code-var)}
.pc-code [data-t=constant]{color:var(--pc-code-const)}
.pc-code [data-t=punctuation]{color:var(--pc-code-punct)}
.pc-code [data-t=operator]{color:var(--pc-code-op)}
.pc-code [data-t=comment]{color:var(--pc-code-comment);font-style:italic}
.pc-code-line{display:grid;grid-template-columns:var(--pc-code-gutter,0) minmax(0,1fr);min-height:1.5rem}
.pc-code[data-ln=false] .pc-code-line{grid-template-columns:minmax(0,1fr)}
.pc-code-line[data-hl]{background:color-mix(in oklab,var(--chart-1) 10%,transparent);box-shadow:inset 3px 0 var(--chart-1)}
.pc-code-ln{color:var(--muted-foreground);text-align:end;padding-inline-end:1rem;user-select:none;-webkit-user-select:none}
.pc-code-text{white-space:pre}
.pc-code[data-wrap=true] .pc-code-text{white-space:pre-wrap;overflow-wrap:anywhere}
.pc-code[data-appear=lines] .pc-code-line{animation:pc-code-in .4s var(--pc-ease-out) both;animation-delay:calc(var(--i) * 28ms)}
.pc-code[data-appear=fade]{animation:pc-code-in .35s ease-out both}
@keyframes pc-code-in{from{opacity:0;transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){.pc-code[data-appear] .pc-code-line,.pc-code[data-appear]{animation:none}}
`

export type CodeBlockLabels = { copy: string; copied: string; wrap: string; code: string }
const DEFAULT_LABELS: CodeBlockLabels = { copy: "Copy code", copied: "Copied", wrap: "Wrap long lines", code: "Code" }

export type CodeBlockProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Source text. Tokenized with the built-in tokenizer unless `tokens` is passed. */
  code: string
  language?: CodeLanguage
  /** Pre-tokenized lines from your own highlighter; each token's type picks the color. Overrides the built-in tokenizer. */
  tokens?: CodeToken[][]
  /** Shown as a tab in the header, e.g. "lib/booking.ts". */
  fileName?: string
  /** Replaces the language label next to the file tab. */
  title?: string
  showLineNumbers?: boolean
  /** Number of the first line. */
  startLine?: number
  /** 1-based line numbers (counted from startLine) to highlight. */
  highlightLines?: number[]
  /** Controlled wrap state. */
  wrap?: boolean
  defaultWrap?: boolean
  onWrapChange?: (wrap: boolean) => void
  /** Show the wrap toggle. */
  wrapToggle?: boolean
  /** Show the copy button. */
  copy?: boolean
  onCopy?: (code: string) => void
  /** Scroll inside the block beyond this height (px). */
  maxHeight?: number
  /** Entrance: lines fade up one after another, the whole block fades, or nothing. */
  appear?: "none" | "fade" | "lines"
  /** Text for built-in controls and screen readers; pass translations here. */
  labels?: Partial<CodeBlockLabels>
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.cssText = "position:fixed;opacity:0;top:0;left:0"
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand("copy")
    } catch {}
    ta.remove()
    return ok
  }
}

/** Syntax-colored code with line numbers, a file tab, copy and wrap controls. */
export function CodeBlock({
  code,
  language = "text",
  tokens: tokensProp,
  fileName,
  title,
  showLineNumbers = true,
  startLine = 1,
  highlightLines,
  wrap: wrapProp,
  defaultWrap = false,
  onWrapChange,
  wrapToggle = true,
  copy = true,
  onCopy,
  maxHeight,
  appear = "none",
  labels,
  className,
  ...props
}: CodeBlockProps) {
  const l = useLabels("code-block", DEFAULT_LABELS, labels)
  const [wrapInner, setWrapInner] = React.useState(defaultWrap)
  const wrap = wrapProp ?? wrapInner
  const [copied, setCopied] = React.useState(false)
  const lines = React.useMemo(() => tokensProp ?? tokenizeCode(code, language), [code, language, tokensProp])
  const hl = React.useMemo(() => new Set(highlightLines ?? []), [highlightLines])
  const digits = String(startLine + lines.length - 1).length

  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const doCopy = async () => {
    if (await writeClipboard(code)) setCopied(true)
    onCopy?.(code)
  }
  const toggleWrap = () => {
    if (wrapProp === undefined) setWrapInner(!wrap)
    onWrapChange?.(!wrap)
  }
  const langLabel = title ?? (language === "text" ? undefined : language)

  return (
    <div
      className={cn("pc-code overflow-hidden rounded-xl border bg-card text-[13px] text-card-foreground", className)}
      data-wrap={wrap}
      data-ln={showLineNumbers}
      data-appear={appear === "none" ? undefined : appear}
      style={{ ["--pc-code-gutter" as string]: `${digits + 2.5}ch` }}
      {...props}
    >
      <GooduiTokens />
      <style href="pc-code-block" precedence="default">
        {CODE_CSS}
      </style>
      <div className="flex h-10 items-center gap-2 border-b bg-muted/40 ps-2 pe-1.5">
        {fileName ? (
          <span className="inline-flex h-7 max-w-[60%] items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium">
            <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{fileName}</span>
          </span>
        ) : (
          <span className="ps-1 text-xs font-medium text-muted-foreground">{langLabel ?? l.code}</span>
        )}
        {fileName && langLabel && <span className="text-xs text-muted-foreground">{langLabel}</span>}
        <span className="flex-1" />
        {wrapToggle && (
          <button
            type="button"
            aria-pressed={wrap}
            aria-label={l.wrap}
            title={l.wrap}
            onClick={toggleWrap}
            className="pc-press grid size-7 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-muted aria-pressed:text-foreground"
          >
            <WrapText className="size-4" aria-hidden="true" />
          </button>
        )}
        {copy && (
          <button
            type="button"
            aria-label={copied ? l.copied : l.copy}
            title={l.copy}
            onClick={doCopy}
            className="pc-press relative grid size-7 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Copy className={cn("size-4 transition-[opacity,transform] duration-200", copied && "scale-50 opacity-0")} aria-hidden="true" />
            <Check className={cn("absolute size-4 text-emerald-600 transition-[opacity,transform] duration-200 dark:text-emerald-400", copied ? "scale-100 opacity-100" : "scale-50 opacity-0")} aria-hidden="true" />
            <span className="sr-only" aria-live="polite">
              {copied ? l.copied : ""}
            </span>
          </button>
        )}
      </div>
      <div className="overflow-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset" style={{ maxHeight }} tabIndex={0} dir="ltr">
        <pre className="m-0 py-3 font-mono leading-6">
          <code className="block">
            {lines.map((tokens, i) => (
              <span key={i} className="pc-code-line px-3" data-hl={hl.has(startLine + i) ? "" : undefined} style={appear === "lines" ? { ["--i" as string]: Math.min(i, 24) } : undefined}>
                {showLineNumbers && (
                  <span className="pc-code-ln" aria-hidden="true">
                    {startLine + i}
                  </span>
                )}
                <span className="pc-code-text">
                  <CodeTokens tokens={tokens} />
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
