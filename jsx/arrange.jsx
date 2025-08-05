// Illustrator ExtendScript Functions
function arrangeImages(columns, rowGap, colGap, useWidth, wVal, useHeight, hVal) {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        alert("Please select items to arrange");
        return;
    }

    // Store items and get starting position
    var items = [];
    var startX = selection[0].left;
    var startY = selection[0].top;

    for (var i = 0; i < selection.length; i++) {
        items.push(selection[i]);
        if (useWidth && wVal > 0) {
            var aspectRatio = items[i].height / items[i].width;
            items[i].width = wVal;
            items[i].height = wVal * aspectRatio;
        }
        if (useHeight && hVal > 0) {
            var aspectRatio = items[i].width / items[i].height;
            items[i].height = hVal;
            items[i].width = hVal * aspectRatio;
        }
    }

    // Arrange items using current position tracking
    var currentX = startX;
    var currentY = startY;
    var maxRowHeight = 0;
    var count = 0;

    for (var i = 0; i < items.length; i++) {
        // Position current item
        items[i].left = currentX;
        items[i].top = currentY;

        // Update maxRowHeight if current item is taller
        maxRowHeight = Math.max(maxRowHeight, items[i].height);

        count++;

        // Move to next position
        if (count < columns) {
            // Move right
            currentX += items[i].width + colGap;
        } else {
            // Move to next row
            count = 0;
            currentX = startX;
            currentY -= maxRowHeight + rowGap;
            maxRowHeight = 0;
        }
    }
}

function addLabelsToImages(fontFamily, fontSize, labelOffsetX, labelOffsetY, labelTemplate) {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        alert("Please select items to label");
        return;
    }

    var templates = {
        "A": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a": "abcdefghijklmnopqrstuvwxyz",
        "A)": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a)": "abcdefghijklmnopqrstuvwxyz"
    };

    var labels = templates[labelTemplate] || templates["A"];
    //alert(selection.length);
    for (var i = 0; i < selection.length; i++) {
        try {
            var item = selection[i];
            var label = labels[i % labels.length];
            if (labelTemplate === "A)" || labelTemplate === "a)") {
                label += ")";
            }
            // Create text frame below the item
            var textFrame = doc.textFrames.add();
            textFrame.contents = label;
            // Position text frame below the item
            textFrame.top = item.top - labelOffsetY;
            textFrame.left = item.left + labelOffsetX;

            // Style the text
            textFrame.textRange.characterAttributes.size = fontSize;
            try {
                textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontFamily === "Arial" ? "ArialMT" : fontFamily);
            } catch (e) {
                alert("Font not found: " + fontFamily);
            }
        } catch (e) {
            // Handle errors without stopping the loop
            alert("Error adding label to item " + (i + 1) + ": " + e.message);
        }
    }
}


function copyRelativePosition() {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length !== 2) {
        return "Error: Please select exactly two items (first the reference object, then the object to measure).";
    }

    var item1 = selection[1]; // The reference object (e.g., the mai image)
    var item2 = selection[0]; // The object whose position is relative (e.g., the label)

    // Using geometric bounds for positioning
    var bounds1 = item1.geometricBounds; // [left, top, right, bottom]
    var bounds2 = item2.geometricBounds;

    var deltaX = bounds2[0] - bounds1[0];
    var deltaY = bounds2[1] - bounds1[1];

    return deltaX + "," + deltaY;
}

function pasteRelativePosition(deltaX, deltaY, reverse) {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length !== 2) {
        return "Error: Please select exactly two items (first the new reference object, then the object to move).";
    }

    var newReference = reverse ? selection[0] : selection[1];
    var objectToMove = reverse ? selection[1] : selection[0];

    var refBounds = newReference.geometricBounds;
    var objBounds = objectToMove.geometricBounds;
    // reverse=true的时候，deltaX和deltaY自动取反
    var newLeft = refBounds[0] + (reverse ? -deltaX : deltaX);
    var newTop = refBounds[1] + (reverse ? -deltaY : deltaY);

    // Move the object to the new calculated position
    // We adjust by the difference between the current top-left and the new top-left.
    objectToMove.translate(newLeft - objBounds[0], newTop - objBounds[1]);

    return "Success";
}
