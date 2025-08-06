// Illustrator ExtendScript Functions
// Helper function to convert mm to points
function mmToPoints(mm) {
    return mm * 2.83464567;
}
function pointsToMm(points) {
    return points / 2.83464567;
}

// 更稳健的获取“可视区域”边界，参考用户提供逻辑，优先基于剪切路径/复合路径计算
// 返回 [left, top, right, bottom]，未能获取时返回 undefined
function getVisibleBounds(o) {
    var bounds, clippedItem, sandboxItem, sandboxLayer;
    var curItem;

    // 跳过参考线
    if (o.guides) {
        return undefined;
    }

    if (o.typename == "GroupItem") {
        // 空组直接跳过
        if (!o.pageItems || o.pageItems.length == 0) {
            return undefined;
        }
        // 组被剪切
        if (o.clipped) {
            // 在子项中寻找 clipping path
            for (var i = 0; i < o.pageItems.length; i++) {
                curItem = o.pageItems[i];
                if (curItem.clipping) {
                    clippedItem = curItem;
                    break;
                } else if (curItem.typename == "CompoundPathItem") {
                    if (!curItem.pathItems.length) {
                        // 处理没有 pathItems 的复合路径（沙盒层拆复合）
                        sandboxLayer = app.activeDocument.layers.add();
                        sandboxItem = curItem.duplicate(sandboxLayer);
                        app.activeDocument.selection = null;
                        sandboxItem.selected = true;
                        app.executeMenuCommand("noCompoundPath");
                        sandboxLayer.hasSelectedArtwork = true;
                        app.executeMenuCommand("group");
                        clippedItem = app.activeDocument.selection[0];
                        break;
                    } else if (curItem.pathItems[0].clipping) {
                        clippedItem = curItem;
                        break;
                    }
                }
            }
            if (!clippedItem) {
                clippedItem = o.pageItems[0];
            }
            bounds = clippedItem.geometricBounds;
            if (sandboxLayer) {
                // 清理沙盒
                sandboxLayer.remove();
                sandboxLayer = undefined;
            }
        } else {
            // 非剪切组：聚合所有子项的可视边界
            var subObjectBounds;
            var allBoundPoints = [[], [], [], []];
            for (var j = 0; j < o.pageItems.length; j++) {
                curItem = o.pageItems[j];
                subObjectBounds = getVisibleBounds(curItem);
                if (!subObjectBounds) continue;
                for (var k = 0; k < subObjectBounds.length; k++) {
                    allBoundPoints[k].push(subObjectBounds[k]);
                }
            }
            if (allBoundPoints[0].length) {
                bounds = [
                    Math.min.apply(Math, allBoundPoints[0]),
                    Math.max.apply(Math, allBoundPoints[1]),
                    Math.max.apply(Math, allBoundPoints[2]),
                    Math.min.apply(Math, allBoundPoints[3])
                ];
            } else {
                // 回退
                bounds = o.geometricBounds;
            }
        }
    } else {
        // 基础对象：直接用几何边界
        bounds = o.geometricBounds;
    }
    return bounds;
}

// 统一封装：返回对象的可视信息
function getVisibleInfo(item) {
    var vb = getVisibleBounds(item) || item.visibleBounds;
    var left = vb[0];
    var top = vb[1];
    var right = vb[2];
    var bottom = vb[3];
    var width = right - left;
    var height = top - bottom;
    return {
        left: left,
        top: top,
        right: right,
        bottom: bottom,
        width: width,
        height: height,
        bounds: vb
    };
}

// 按目标“可视宽度”进行等比缩放（基于 getVisibleBounds 计算比例）
function scaleItemToVisibleWidth(item, targetW) {
    if (!targetW || targetW <= 0) return;
    var info = getVisibleInfo(item);
    if (info.width <= 0) return;
    var scale = (targetW / info.width) * 100; // 百分比
    item.resize(scale, scale, true, true, true, true, scale, Transformation.CENTER);
}

// 按目标“可视高度”进行等比缩放（基于 getVisibleBounds 计算比例）
function scaleItemToVisibleHeight(item, targetH) {
    if (!targetH || targetH <= 0) return;
    var info = getVisibleInfo(item);
    if (info.height <= 0) return;
    var scale = (targetH / info.height) * 100;
    item.resize(scale, scale, true, true, true, true, scale, Transformation.CENTER);
}

// 将对象的可视左上角移动到指定 (xLeft, yTop)
function moveItemTopLeftTo(item, xLeft, yTop) {
    var info = getVisibleInfo(item);
    var dx = xLeft - info.left;
    var dy = yTop - info.top;
    item.translate(dx, dy);
}

function arrangeImages(columns, rowGap, colGap, useWidth, wVal, useHeight, hVal) {
    if (app.documents.length === 0) return;

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        alert("Please select items to arrange");
        return;
    }

    // Convert mm values to points
    var rowGapPt = mmToPoints(rowGap);
    var colGapPt = mmToPoints(colGap);
    var wValPt = useWidth ? mmToPoints(wVal) : 0;
    var hValPt = useHeight ? mmToPoints(hVal) : 0;

    // 起点：第一个对象的可视左上
    var firstInfo = getVisibleInfo(selection[0]);
    var startX = firstInfo.left;
    var startY = firstInfo.top;

    // 先按需要统一缩放（基于可视宽/高）
    for (var i = 0; i < selection.length; i++) {
        var it = selection[i];
        if (useHeight && hVal > 0) {
            scaleItemToVisibleHeight(it, hValPt);
        }
        if (useWidth && wVal > 0) {
            scaleItemToVisibleWidth(it, wValPt);
        }
    }

    // Arrange items using current position tracking (基于可视尺寸与位置)
    var currentX = startX;
    var currentY = startY;
    var maxRowHeight = 0;
    var count = 0;

    for (var j = 0; j < selection.length; j++) {
        var item = selection[j];
        // 将当前 item 的可视左上角对齐到 currentX/currentY
        moveItemTopLeftTo(item, currentX, currentY);

        // 获取对齐后的最新可视信息
        var infoAfter = getVisibleInfo(item);

        // 更新本行最大“可视高度”
        if (infoAfter.height > maxRowHeight) {
            maxRowHeight = infoAfter.height;
        }

        count++;
        if (count < columns) {
            // 横向推进：可视宽度 + 列间距
            currentX += infoAfter.width + colGapPt;
        } else {
            // 换行
            count = 0;
            currentX = startX;
            currentY -= maxRowHeight + rowGapPt;
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
    for (var i = 0; i < selection.length; i++) {
        try {
            var item = selection[i];
            var label = labels[i % labels.length];
            if (labelTemplate === "A)" || labelTemplate === "a)") {
                label += ")";
            }
            // 基于可视区域定位标签
            var v = getVisibleInfo(item);
            var textFrame = doc.textFrames.add();
            textFrame.contents = label;
            // 将标签放在可视左上位置并加偏移
            textFrame.top = v.top - labelOffsetY;
            textFrame.left = v.left + labelOffsetX;

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


function copyRelativePosition(corner) {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length !== 2) {
        return "Error: Please select exactly two items (first the reference object, then the object to measure).";
    }

    var item1 = selection[1]; // The reference object
    var item2 = selection[0]; // The object whose position is relative

    var bounds1 = item1.geometricBounds; // [left, top, right, bottom]
    var bounds2 = item2.geometricBounds;

    var x1, y1, x2, y2;

    // Determine coordinates based on the selected corner
    switch (corner) {
        case "TL": // Top-Left
            x1 = bounds1[0];
            y1 = bounds1[1];
            x2 = bounds2[0];
            y2 = bounds2[1];
            break;
        case "TR": // Top-Right
            x1 = bounds1[2];
            y1 = bounds1[1];
            x2 = bounds2[2];
            y2 = bounds2[1];
            break;
        case "BL": // Bottom-Left
            x1 = bounds1[0];
            y1 = bounds1[3];
            x2 = bounds2[0];
            y2 = bounds2[3];
            break;
        case "BR": // Bottom-Right
            x1 = bounds1[2];
            y1 = bounds1[3];
            x2 = bounds2[2];
            y2 = bounds2[3];
            break;
        default: // Default to Top-Left
            x1 = bounds1[0];
            y1 = bounds1[1];
            x2 = bounds2[0];
            y2 = bounds2[1];
            break;
    }

    var deltaX = x2 - x1;
    var deltaY = y2 - y1;

    return pointsToMm(deltaX) + "," + pointsToMm(deltaY);
}

function pasteRelativePosition(deltaX, deltaY, reverse, corner) {
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

    var finalDeltaX = reverse ? -deltaX : deltaX;
    var finalDeltaY = reverse ? -deltaY : deltaY;

    // Convert mm from UI back to points for ExtendScript
    var deltaXPt = mmToPoints(finalDeltaX);
    var deltaYPt = mmToPoints(finalDeltaY);
    
    var newX, newY;

    // Calculate new position based on the selected corner
    switch (corner) {
        case "TL": // Top-Left
            newX = refBounds[0] + deltaXPt;
            newY = refBounds[1] + deltaYPt;
            objectToMove.translate(newX - objBounds[0], newY - objBounds[1]);
            break;
        case "TR": // Top-Right
             newX = refBounds[2] + deltaXPt;
             newY = refBounds[1] + deltaYPt;
             objectToMove.translate(newX - objBounds[2], newY - objBounds[1]);
            break;
        case "BL": // Bottom-Left
             newX = refBounds[0] + deltaXPt;
             newY = refBounds[3] + deltaYPt;
             objectToMove.translate(newX - objBounds[0], newY - objBounds[3]);
            break;
        case "BR": // Bottom-Right
             newX = refBounds[2] + deltaXPt;
             newY = refBounds[3] + deltaYPt;
             objectToMove.translate(newX - objBounds[2], newY - objBounds[3]);
            break;
        default: // Default to Top-Left
            newX = refBounds[0] + deltaXPt;
            newY = refBounds[1] + deltaYPt;
            objectToMove.translate(newX - objBounds[0], newY - objBounds[1]);
            break;
    }

    return "Success";
}
