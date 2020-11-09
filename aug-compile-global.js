/**
 * aug-compile
 * BSD 2-Clause License
 * Copyright (c) 2020 James0x57, PropJockey
 */
const augWebkitPrefix = typeof CSS !== "undefined" && CSS.supports && CSS.supports(
  "((--foo: , 0 0) and (-webkit-clip-path: polygon(0 0, 100% 0, 50% 50%)) and (not (clip-path: polygon(0 0, 100% 0, 50% 50%))))"
) ? "-webkit-" : ""

const augCompileSheet = (() => {
  const d = document
  const h = d.head
  const s = d.createElement("style")
  s.setAttribute("data-aug-compile-styles", "")
  const b4 = d.querySelector("head > :first-child")
  return b4 ? h.insertBefore(s, b4).sheet : h.appendChild(s).sheet
})()

augCompileSheet.insertRule(
  `[data-augmented-ui-border-compiled], [data-augmented-ui-compiled]::after {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    pointer-events: none;
  }`, 0
)
augCompileSheet.insertRule(
  `[data-augmented-ui-inlay-compiled], [data-augmented-ui-compiled]::before {
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

const augCompileFeatureWrites = function (augEl, id, pseudoSelector, type, x, writes) {
  const cs = getComputedStyle(augEl, pseudoSelector)
  const clip = cs.getPropertyValue("clip-path")
  if (clip.length > 20) {
    const op = `opacity: ${cs.getPropertyValue("opacity")};`
    const bg = `background: ${cs.getPropertyValue(`--aug-${type}-bg`) || `var(--aug-${type}-bg)`};`
    writes.push({ fn: "css", css: `[data-augmented-ui-compiled~="${id}"]${pseudoSelector} { content: ""; ${augWebkitPrefix}clip-path: ${clip}; ${op} ${bg} }`, x })
    x++
  }
  return x
}

const augCompileDelegatesWrites = function (augEl, id, type, x, writes) {
  const daut = "data-augmented-ui-" + type
  augEl.querySelectorAll("[" + daut + "]").forEach(el => {
    if (el.closest("[data-augmented-ui]") === augEl) {
      const cs = getComputedStyle(el)
      const clip = cs.getPropertyValue("clip-path")
      if (clip.length > 20) {
        const op = `opacity: ${cs.getPropertyValue("opacity")};`
        const bg = `background: ${cs.getPropertyValue(`--aug-${type}-bg`) || `var(--aug-${type}-bg)`};`
        writes.push({ fn: "css", css: `[${daut}-compiled~="${id}"] { ${augWebkitPrefix}clip-path: ${clip}; ${op} ${bg} }`, x })
        writes.push({ fn: "setAttribute", target: el, prop: daut + "-compiled", val: id + " " + (augEl.getAttribute(daut) || "") })
        writes.push({ fn: "removeAttribute", target: el, prop: daut })
        x++
      }
    }
  })
  return x
}

const augCompileElWrites = function (augEl, x, writes) {
  const id = "compile-" + x.toString(36)
  const augs = (id + " " + augEl.getAttribute("data-augmented-ui")).trim()
  const hasAllAug = /\ball-./.test(augs)
  const cs = getComputedStyle(augEl)
  const clip = cs.getPropertyValue("clip-path")
  if (clip.length > 20) {
    // augmented-ui internal static minification map
    // "--aug__elwidth": "--aug_at",
    // "--aug__elheight": "--aug_au",
    // reading the vars instead of width/height directly mantains the author's (possibly flexible) units instead of forcing px
    const wd = hasAllAug ? `width: calc(${cs.getPropertyValue("--aug_at") || cs.getPropertyValue("--aug__elwidth")});` : ""
    const ht = hasAllAug ? `height: calc(${cs.getPropertyValue("--aug_au") || cs.getPropertyValue("--aug__elheight")});` : ""
    writes.push({ fn: "css", css: `[data-augmented-ui-compiled~="${id}"] { ${augWebkitPrefix}clip-path: ${clip}; ${wd} ${ht} }`, x })
    x++
  }
  if (cs.getPropertyValue("--aug-delegated-inlay") === "") { // initial in js land is an empty string
    x = augCompileDelegatesWrites(augEl, id, "inlay", x, writes)
  } else {
    x = augCompileFeatureWrites(augEl, id, "::before", "inlay", x, writes)
  }
  if (cs.getPropertyValue("--aug-delegated-border") === "") { // initial in js land is an empty string
    x = augCompileDelegatesWrites(augEl, id, "border", x, writes)
  } else {
    x = augCompileFeatureWrites(augEl, id, "::after", "border", x, writes)
  }
  writes.push({ fn: "removeAttribute", target: augEl, prop: "data-augmented-ui" })
  writes.push({ fn: "setAttribute", target: augEl, prop: "data-augmented-ui-compiled", val: augs })
  return x
}

const augWriteAll = function (writes) {
  let cssCount = 0
  for (let i = 0; i < writes.length; i++) {
    const write = writes[i]
    switch (write.fn) {
      case "css": {
        augCompileSheet.insertRule(write.css, write.x)
        cssCount++
        break
      }
      case "setAttribute": {
        write.target.setAttribute(write.prop, write.val)
        break
      }
      case "removeAttribute": {
        write.target.removeAttribute(write.prop)
        break
      }
    }
  }
  return cssCount
}

const augCompileElSync = function (augEl) {
  // gather writes for the end of the frame, do all reads first
  const writes = []
  augCompileElWrites(augEl, augCompileSheet.cssRules.length, writes)
  return augWriteAll(writes)
}

const augCompileEl = function (augEl) {
  const onFrame = ts => augCompileElSync(augEl)
  return (new Promise(requestAnimationFrame)).then(onFrame)
}

const augCompileAllSync = function (qs) {
  // gather writes for the end of the frame, do all reads first
  const writes = []
  const targets = document.querySelectorAll(qs || '[data-augmented-ui~="compile"]')
  let x = augCompileSheet.cssRules.length
  targets.forEach(el => {
    x = augCompileElWrites(el, x, writes)
  })
  return augWriteAll(writes)
}

const augCompileAll = function (qs) {
  const onFrame = ts => augCompileAllSync(qs, ts)
  return (new Promise(requestAnimationFrame)).then(onFrame)
}

const augCompileRevertEl = function (el) {
  let id
  const augs = el.getAttribute("data-augmented-ui-compiled").replace(/compile-[a-z0-9]+/gi, _ => ((id = _), ""))
  el.removeAttribute("data-augmented-ui-compiled")
  el.setAttribute("data-augmented-ui", augs)
  el.querySelectorAll("[data-augmented-ui-inlay-compiled~=" + id + "]").forEach(el => {
    el.setAttribute("data-augmented-ui-inlay", el.getAttribute("data-augmented-ui-inlay-compiled").replace(/compile-[a-z0-9]+/gi, ""))
    el.removeAttribute("data-augmented-ui-inlay-compiled")
  })
  el.querySelectorAll("[data-augmented-ui-border-compiled~=" + id + "]").forEach(el => {
    el.setAttribute("data-augmented-ui-border", el.getAttribute("data-augmented-ui-border-compiled").replace(/compile-[a-z0-9]+/gi, ""))
    el.removeAttribute("data-augmented-ui-border-compiled")
  })
  const idTest = new RegExp("\\b" + id + "\\b")
  const rules = augCompileSheet.cssRules
  const rlen = rules.length
  let deleted = 0
  for (let i = rlen - 1; i >= 0; i--) {
    const r = rules[i]
    if (idTest.test(r.selectorText)) {
      augCompileSheet.deleteRule(i)
      deleted++
    }
  }
  return deleted
}
