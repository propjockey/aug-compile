/**
 * aug-compile
 * BSD 2-Clause License
 * Copyright (c) 2020 James0x57, PropJockey
 */
const augCompileSheet = (() => {
  const d = document
  const h = d.head
  const s = d.createElement("style")
  s.setAttribute("data-aug-compile-styles", "")
  const b4 = d.querySelector("head > :first-child")
  return b4 ? h.insertBefore(s, b4).sheet : h.appendChild(s).sheet
})()
augCompileSheet.insertRule(
  `[data-augmented-ui-compiled]::after {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    pointer-events: none;
  }`, 0
)
augCompileSheet.insertRule(
  `[data-augmented-ui-compiled]::before {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    z-index: -1;
  }`, 0
)
augCompileSheet.insertRule(
  `[data-augmented-ui-compiled] {
    isolation: isolate;
    position: relative;
  }`, 0
)

const augCompileEl = function (augEl) {
  let x = augCompileSheet.cssRules.length
  const id = "compile-" + x.toString(36)
  const val = (id + " " + augEl.getAttribute("data-augmented-ui")).trim()
  const hasAllAug = /\ball-./.test(val)
  const cs1 = getComputedStyle(augEl)
  const clip1 = cs1.getPropertyValue("clip-path")
  const usewebkit = CSS.supports("((--foo: , 0 0) and (-webkit-clip-path: polygon(0 0, 100% 0, 50% 50%)) and (not (clip-path: polygon(0 0, 100% 0, 50% 50%))))")
  const webkit = usewebkit ? "-webkit-" : ""
  if (clip1.length > 20) {
    // augmented-ui internal static minification map
    // "--aug__elwidth": "--aug_at",
    // "--aug__elheight": "--aug_au",
    // reading the vars instead of width/height directly mantains the author's (possibly flexible) units instead of forcing px
    const wd = hasAllAug ? `width: calc(${cs1.getPropertyValue("--aug_at") || cs1.getPropertyValue("--aug__elwidth")});` : ""
    const ht = hasAllAug ? `height: calc(${cs1.getPropertyValue("--aug_au") || cs1.getPropertyValue("--aug__elheight")});` : ""
    augCompileSheet.insertRule( `[data-augmented-ui-compiled~="${id}"] { ${webkit}clip-path: ${clip1}; ${wd} ${ht} }`, x )
    x++
  }
  const cs2 = getComputedStyle(augEl, "::before")
  const clip2 = cs2.getPropertyValue("clip-path")
  if (clip2.length > 20) {
    const op = `opacity: ${cs2.getPropertyValue("opacity")};`
    const bg = `background: ${cs2.getPropertyValue("background") || cs2.getPropertyValue("--aug-inlay-bg") || "var(--aug-inlay-bg)"};`
    augCompileSheet.insertRule( `[data-augmented-ui-compiled~="${id}"]::before { content: ""; ${webkit}clip-path: ${clip2}; ${op} ${bg} }`, x )
    x++
  }
  const cs3 = getComputedStyle(augEl, "::after")
  const clip3 = cs3.getPropertyValue("clip-path")
  if (clip3.length > 20) {
    const op = `opacity: ${cs3.getPropertyValue("opacity")};`
    const bg = `background: ${cs3.getPropertyValue("background") || cs3.getPropertyValue("--aug-border-bg") || "var(--aug-border-bg)"};`
    augCompileSheet.insertRule( `[data-augmented-ui-compiled~="${id}"]::after { content: ""; ${webkit}clip-path: ${clip3}; ${op} ${bg} }`, x )
    x++
  }
  augEl.removeAttribute("data-augmented-ui")
  augEl.setAttribute("data-augmented-ui-compiled", val)
}

const augCompileAll = function (qs) {
  const targets = document.querySelectorAll(qs || '[data-augmented-ui~="compile"]')
  targets.forEach(augCompileEl)
}

const augCompileRevertEl = function (el) {
  const val = el.getAttribute("data-augmented-ui-compiled").replace(/compile-[a-z0-9]+/gi, "")
  el.removeAttribute("data-augmented-ui-compiled")
  el.setAttribute("data-augmented-ui", val)
}

export { augCompileEl, augCompileAll, augCompileRevertEl }
export default augCompileAll
