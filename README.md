![James0x57](https://img.shields.io/badge/James0x57%20%F0%9F%91%BD-I%20made%20a%20thing!-blueviolet.svg?labelColor=222222)

# aug-compile from PropJockey
Get the most out of your runtime performance by compiling static augmented-ui v2+ configurations up front.

If you've got animations or other dynamic content that causes augmented-ui elements to be repainted unnecessarily (like setting any --css-var on any ancestor in the dom), you can use `aug-compile` to remove all the customizable overhead (and the associated memory overhead) from static augmented-ui elements for an as-fast-as-possible repaint.

Great for high-performance webapps and games, and for environments with constrained memory like smart watches and hobby robotics.

# Setup

assumes you're using [augmented-ui](http://augmented-ui.com/) already

```
npm install aug-compile
```

```js
import augCompileAll from "aug-compile"
or
import { augCompileEl, augCompileAll, augCompileRevertEl } from "aug-compile"
```

or

```html
<script type="module">
  import augCompileAll from "https://unpkg.com/aug-compile/aug-compile-es6.js"
</script>
```

or

```html
<!-- Global option: copy aug-compile-global.js into your site files and include it -->
<script src="/aug-compile-global.js"></script>
<!-- now these are available globally: augCompileEl, augCompileAll, augCompileRevertEl -->
```

# Usage

Any static augmented element (ones that do not have an --aug- property toggling after the page is loaded, no responsive design changes after load, have no hover states, no dom reordering that causes a different configuration, and no --aug-prop animations) can be compiled to remove all variables that produce the augmented-ui shape and appearance.

By default `augCompileAll()` will compile all of the elements on the page with a `data-augmented-ui` attribute with a value containing the word `compile`:

```html
<div data-augmented-ui="compile"></div>
<div data-augmented-ui="br-clip tl-clip both"></div>
<div data-augmented-ui="tl-clip-x border br-scoop compile"></div>
```

`augCompileAll()`

```html
<div data-augmented-ui-compiled="compile-1 compile"></div>
<div data-augmented-ui="br-clip tl-clip both"></div>
<div data-augmented-ui-compiled="compile-2 tl-clip-x border br-scoop compile"></div>
```

Note: this removes the `data-augmented-ui` attribute so if you're using it to style the elements, you'll have to change your selector.

The `augCompileRevertEl(compiledAugEl)` function takes a compiled element and restores it to the original state. This does not remove the compiled rule that was generated originally. (you could compile one as a template and copy the data-augmented-ui-compiled attribute to other elements to re-use the compiled state)

```js
augCompileRevertEl(document.querySelector("[data-augmented-ui-compiled]"))
```

```html
<div data-augmented-ui="compile"></div>
<div data-augmented-ui="br-clip tl-clip both"></div>
<div data-augmented-ui-compiled="compile-2 tl-clip-x border br-scoop compile"></div>
```

`augCompileAll("#any .query, select.or")` may take a query selector as an argument if you wish to specify what elements to compile in a different way. If you use a selector, adding `compile` to the `data-augmented-ui` attribute value is not necessary.

`augCompileEl` takes a single augmented dom el and compiles it

The stylesheet generated for this is inserted as the first child of the `<head>` and has a `data-aug-compile-styles` attribute to make it easier to find and query. You can access the styles and manually manage them if you wish:

```js
const augCompileSheet = document.querySelector("[data-aug-compile-styles]").sheet
// note: if you're using the global script, augCompileSheet already exists
```
