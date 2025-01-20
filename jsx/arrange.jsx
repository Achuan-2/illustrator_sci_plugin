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
        "A)": "ABCDEFGHIJKLMNOPQRSTUVWXYZ)",
        "a)": "abcdefghijklmnopqrstuvwxyz)"
    };

    var labels = templates[labelTemplate] || templates["A"];

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];

        // Create text frame below the item
        var textFrame = doc.textFrames.add();
        textFrame.contents = labels[i % labels.length];

        // Position text frame below the item
        textFrame.top = item.top - labelOffsetY;
        textFrame.left = item.left + labelOffsetX;

        // Style the text
        textFrame.textRange.characterAttributes.size = fontSize;
        textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontFamily);
    }
}

