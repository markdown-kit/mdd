/**
 * Rewrites an MDD 2 document into the MDD 3 spelling: `:::name` … `:::` for
 * block directives and `::page-break` / `::section-break` for the
 * self-closing ones. Everything else is left byte for byte, including
 * fenced code, so a document already in MDD 3 comes back unchanged.
 */

const BLOCK_DIRECTIVES = new Set(['letterhead', 'header', 'footer', 'contact-info', 'signature-block'])

/** Match an opening/closing fenced-code delimiter (``` or ~~~, length >= 3). */
const CODE_FENCE = /^(`{3,}|~{3,})/u

/**
 * @param {string} content - An MDD document in either spelling
 * @returns {{ content: string, changed: number }} The MDD 3 text and how many lines were rewritten
 */
export function migrateToMdd3(content) {
  const lines = content.split(/\r?\n/u)
  const out = []
  let changed = 0
  let fenceMarker = null
  let openClose = null // the closer the current MDD 2 block expects

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    const fence = trimmed.match(CODE_FENCE)
    if (fence) {
      const marker = fence[1][0]
      if (fenceMarker === null) fenceMarker = marker
      else if (fenceMarker === marker) fenceMarker = null
      out.push(line)
      continue
    }
    if (fenceMarker !== null) {
      out.push(line)
      continue
    }

    // Self-closing directives, every MDD 2 form.
    if (/^::page-break(?:\s*::)?$/u.test(trimmed)) {
      out.push('::page-break')
      if (trimmed !== '::page-break') changed++
      if (trimmed === '::page-break' && lines[i + 1]?.trim() === '::') {
        i++
        changed++
      }
      continue
    }
    if (/^:::\s*section-break(?:\s*:::)?$/u.test(trimmed)) {
      out.push('::section-break')
      changed++
      if (/^:::\s*section-break$/u.test(trimmed) && lines[i + 1]?.trim() === ':::') i++
      continue
    }

    // An MDD 2 block opener, and its closer.
    const opener = trimmed.match(/^::([a-z][a-z0-9-]*)$/u)
    if (opener && BLOCK_DIRECTIVES.has(opener[1]) && openClose === null) {
      out.push(`:::${opener[1]}`)
      openClose = '::'
      changed++
      continue
    }
    if (trimmed === '::' && openClose === '::') {
      out.push(':::')
      openClose = null
      changed++
      continue
    }

    // An MDD 3 block passes through; remember it so a stray `::` inside is content.
    const canonical = trimmed.match(/^:::([a-z][a-z0-9-]*)$/u)
    if (canonical && BLOCK_DIRECTIVES.has(canonical[1]) && openClose === null) openClose = ':::'
    else if (trimmed === ':::' && openClose === ':::') openClose = null

    out.push(line)
  }

  return { content: out.join('\n'), changed }
}
