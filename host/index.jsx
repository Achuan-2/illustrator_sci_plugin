var csInterface = new CSInterface();

// UI Elements
var arrangeButton = document.querySelector("#arrange-button");
var addLabelButton = document.querySelector("#add-label-button");
var columnsInput = document.querySelector("#columns");
var rowGapInput = document.querySelector("#row-gap");
var colGapInput = document.querySelector("#col-gap");

// Event Listeners
arrangeButton.addEventListener("click", handleArrange);
addLabelButton.addEventListener("click", handleAddLabel);

// Handler Functions
function handleArrange() {
    console.log("Arrange button clicked");
    var columns = parseInt(columnsInput.value) || 3;
    var rowGap = parseInt(rowGapInput.value) || 10;
    var colGap = parseInt(colGapInput.value) || 10;
    
    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript(`arrangeImages(${columns}, ${rowGap}, ${colGap})`, function(result) {
        if (result === 'EvalScript error.') {
            alert('Error executing the script');
        }
    });
}

function handleAddLabel() {
    csInterface.evalScript(`$.evalFile("${csInterface.getSystemPath(SystemPath.EXTENSION)}/jsx/arrange.jsx")`);
    csInterface.evalScript('addLabelsToImages()', function(result) {
        if (result === 'EvalScript error.') {
            alert('Error executing the script');
        }
    });
}

// Illustrator ExtendScript Functions
function arrangeImages(columns, rowGap, colGap) {
    if (app.documents.length === 0) return;
    
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
}

function addLabelsToImages() {
    if (app.documents.length === 0) return;
    
    var doc = app.activeDocument;
    var selection = doc.selection;
    
    if (selection.length === 0) {
        alert("Please select items to label");
        return;
    }

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        
        // Create text frame below the item
        var textFrame = doc.textFrames.add();
        textFrame.contents = "Label " + (i + 1);
        
        // Position text frame below the item
        textFrame.top = item.top - item.height - 10;
        textFrame.left = item.left;
        
        // Optional: Style the text
        textFrame.textRange.characterAttributes.size = 10;
    }
}

