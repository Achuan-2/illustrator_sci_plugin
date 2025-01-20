function arrangeImages(columns, rowGap, colGap) {
    try {
        if (app.documents.length === 0) {
            alert("No open documents");
            return;
        }
        
        var doc = app.activeDocument;
        var selection = doc.selection;
        
        if (selection.length === 0) {
            alert("Please select items to arrange");
            return;
        }

        // Sort selection by position
        var items = [];
        for (var i = 0; i < selection.length; i++) {
            items.push(selection[i]);
        }
        
        // Calculate dimensions
        var maxWidth = 0;
        var maxHeight = 0;
        
        for (var i = 0; i < items.length; i++) {
            maxWidth = Math.max(maxWidth, items[i].width);
            maxHeight = Math.max(maxHeight, items[i].height);
        }

        // Arrange items
        var rows = Math.ceil(items.length / columns);
        
        for (var i = 0; i < items.length; i++) {
            var row = Math.floor(i / columns);
            var col = i % columns;
            
            var x = col * (maxWidth + colGap);
            var y = -row * (maxHeight + rowGap);
            
            items[i].left = x;
            items[i].top = y;
        }
    } catch(e) {
        alert("Error: " + e);
    }
}

function addLabelsToImages() {
    try {
        if (app.documents.length === 0) {
            alert("No open documents");
            return;
        }
        
        var doc = app.activeDocument;
        var selection = doc.selection;
        
        if (selection.length === 0) {
            alert("Please select items to label");
            return;
        }

        for (var i = 0; i < selection.length; i++) {
            var item = selection[i];
            
            var textFrame = doc.textFrames.add();
            textFrame.contents = "Label " + (i + 1);
            
            textFrame.top = item.top - item.height - 10;
            textFrame.left = item.left;
            
            textFrame.textRange.characterAttributes.size = 10;
        }
    } catch(e) {
        alert("Error: " + e);
    }
}
