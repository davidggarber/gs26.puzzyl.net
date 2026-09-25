Please create a Python program, normalize-svg.py. It's goal is to de-transform SVG files.

# Parameters

It takes the following parameters:
--File=[path]: a local .svg filename.
--scan: when present, don't do anything, just write a summary
--index=[number]: which transform to undo, in file order, starting at 0. Default is 0.
--unrotate: if present, undo the rotation rather than the translation
--unscale: if present, undo the scale, rather than the translation
--untranslate: the detault. If absent, and either unrotate or unscale are present, plan not to untranslate. But if explicitly present, then plan to undo both/all.

# Find all transformations

Parse the file as XML
Look for any element that includes a `transform` attribute.
Any elements that do not contain a tranform attribute are not indexed.

Hold the file in memory as an XML DOM tree, so we can later walk children.

## Heirarchical numbering

Henceforth, refer to all transform elements by their index, in heirarchical order.

That is, the first is index==0. The second, if not a child of the first, is index==1, etc.
For elements that are inside other elements, their index use dot notation. So the first two children of the first transform would be 0.1 and 0.2.
Nesting can go arbitrarily deep.

# Scan mode

Print out the transform elements that were found. Index, then type of element, then transformation.
Write the type of element as shorthand XML, with just a name, as either a start- or empty tag.

For example:
```
0 <g> translate(100,200)
0.0 <g> rotate(10)
0.0.0 <path> scale(2)
1 <g> translate(400,500) rotate(-10) translate(100,200)
```

# Untranslate

Find the first indexed element.
If its transform's first function is not 'translate', write an error and exit:
  "Element [index] cannot un-translate. Current transform is [transform]."

Create a 3x3 Matrix, settings its parameters from the translate parameters.
Thus, if `transform="translate(123,-456)", then the Matrix would contain:
  [[1,0,123], [0,1,-456], [0,0,1]]

# Applying the transform matrix

Traverse all SVG elements in the specified element, and all children.
Identify each attribute as either X-axis, Y-axis, neither, or mixed.
Examples:
  - X: x or width in `<rect>` or cx in `<circle>`
  - Y: y or height in `<rect>` or cy in `<circle>`
  - neither: stroke, fill
  - mixed: d in `<path>` or points in `<poly>`

Wherever possible, convert these attributes into X,Y pairs. There may be multiple pairs in a tag, either from multiples attributes, or from disecting one attribute.
Example: a <rect> would yield one pair for [x,y], and another pair for [width,height]
Example: a <path> would split the instruction into steps, and each step into one or more X,Y pairs. The one exception is A (arc) steps, which also includes parameters that are not X or Y.

Apply the transform matrix on the x,y pair.
Then regenerate the attributes, and push those back into the elements.

Finally, remove the transform instruction that you've just undone.



# Implementation steps

Implement this script in stages, so we can test each stage.
1. Scan mode
2. Untranslate
3. Unrotate
4. Unscale
5. Combined transforms