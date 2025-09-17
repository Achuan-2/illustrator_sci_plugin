// Illustrator ExtendScript Functions
// Helper function to convert mm to points
function mmToPoints(mm) {
    return mm * 2.83464567;
}
function pointsToMm(points) {
    return points / 2.83464567;
}

// Simple stringifier to avoid ExtendScript's lack of native JSON support
function simpleJsonStringify(arr) {
    var parts = [];
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        parts.push('{"deltaX":' + item.deltaX + ',"deltaY":' + item.deltaY + '}');
    }
    return '[' + parts.join(',') + ']';
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

// 获取对象所在画板索引（通过对象可视边界中心点命中 artboardRect）
function getItemArtboardIndex(item) {
    var doc = app.activeDocument;
    var b = getVisibleBounds(item) || item.visibleBounds;
    var cx = (b[0] + b[2]) / 2;
    var cy = (b[1] + b[3]) / 2;
    for (var i = 0; i < doc.artboards.length; i++) {
        var r = doc.artboards[i].artboardRect; // [left, top, right, bottom]
        if (cx >= r[0] && cx <= r[2] && cy <= r[1] && cy >= r[3]) {
            return i;
        }
    }
    // 回退：当前活动画板或 0
    try {
        return doc.artboards.getActiveArtboardIndex();
    } catch (e) {
        return 0;
    }
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

/**
 * 根据 order 与 reverse 对 selection 进行排序
 * order: "stacking" | "horizontal" | "vertical"
 * reverse: boolean
 */
function getOrderedSelection(selection, order, reverse) {
    var arr = [];
    for (var i = 0; i < selection.length; i++) arr.push(selection[i]);

    var ord = order || "stacking";
    if (ord === "horizontal" || ord === "vertical") {
        arr.sort(function (a, b) {
            var ia = getVisibleInfo(a);
            var ib = getVisibleInfo(b);
            var cxA = ia.left;
            var cyA = ia.top;
            var cxB = ib.left;
            var cyB = ib.top;

            if (ord === "horizontal") {
                // 从左到右
                if (cxA < cxB) return -1;
                if (cxA > cxB) return 1;
                // 次级按 Y 从上到下（top 值大在前）
                if (cyA > cyB) return -1;
                if (cyA < cyB) return 1;
                return 0;
            } else {
                // vertical: 从上到下（top 值大在前）
                if (cyA > cyB) return -1;
                if (cyA < cyB) return 1;
                // 次级按 X 从左到右
                if (cxA < cxB) return -1;
                if (cxA > cxB) return 1;
                return 0;
            }
        });
    } // stacking: 保持原顺序

    if (reverse) {
        var i = 0, j = arr.length - 1, tmp;
        while (i < j) {
            tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
            i++; j--;
        }
    }
    return arr;
}

function arrangeImages(columns, rowGap, colGap, useWidth, wVal, useHeight, hVal, order, reverseOrder) {
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

    // 使用排序后的序列进行排列
    var ordered = getOrderedSelection(selection, order || "stacking", !!reverseOrder);

    // 起点：排序后第一个对象的可视左上
    var firstInfo = getVisibleInfo(ordered[0]);
    var startX = firstInfo.left;
    var startY = firstInfo.top;

    // 先按需要统一缩放（基于可视宽/高）
    for (var i = 0; i < ordered.length; i++) {
        var it = ordered[i];
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

    for (var j = 0; j < ordered.length; j++) {
        var item = ordered[j];
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

function addLabelsToImages(fontFamily, fontSize, fontBold, labelOffsetX, labelOffsetY, labelTemplate, order, reverseOrder, startCount, sessionId) {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        return "Error: Please select items to label";
    }

    startCount = parseInt(startCount) || 1;
    var startIndex = startCount - 1;

    var templates = {
        "A": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a": "abcdefghijklmnopqrstuvwxyz",
        "A)": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a)": "abcdefghijklmnopqrstuvwxyz"
    };

    var labels = templates[labelTemplate] || templates["A"];
    var ordered = getOrderedSelection(selection, order || "stacking", !!reverseOrder);

    for (var i = 0; i < ordered.length; i++) {
        try {
            var item = ordered[i];
            var labelIndex = (startIndex + i) % labels.length;
            var label = labels[labelIndex];
            if (labelTemplate === "A)" || labelTemplate === "a)") {
                label += ")";
            }
            var v = getVisibleInfo(item);
            var textFrame = doc.textFrames.add();
            textFrame.contents = label;
            // 将标签放在可视左上位置并加偏移
            textFrame.top = v.top - labelOffsetY;
            textFrame.left = v.left + labelOffsetX;

            // Style
            textFrame.textRange.characterAttributes.size = fontSize;
            try {
                var fontName = fontFamily === "Arial" ? "ArialMT" : fontFamily;
                // If bold is requested, try to find the bold version of the font
                if (fontBold) {
                    // Try different bold font name patterns
                    var boldFontNames = [
                        fontFamily + "-BoldMT",
                        fontFamily + "-Bold",
                        fontFamily + " Bold",
                        fontName + "-Bold",
                        fontName + "Bold"
                    ];

                    var fontFound = false;
                    for (var k = 0; k < boldFontNames.length; k++) {
                        try {
                            textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(boldFontNames[k]);
                            fontFound = true;
                            break;
                        } catch (e) {
                            // Continue trying other names
                        }
                    }

                    // If no bold font found, use regular font
                    if (!fontFound) {
                        textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontName);
                    }
                } else {
                    textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontName);
                }
            } catch (e) {
                return "Error: Font not found: " + fontFamily;
            }

            // 记录基准信息与会话ID在 note，JSON 字符串
            var payload = '{"sid":' + (sessionId || 0) + ',"baseL":' + v.left + ',"baseT":' + v.top + '}';
            try { textFrame.note = payload; } catch (e) { }
        } catch (e) {
            return "Error: Error adding label to item " + (i + 1) + ": " + e.message;
        }
    }
    return (startCount + ordered.length).toString();
}

function updateLabelIndex(fontFamily, fontSize, fontBold, labelTemplate, order, reverseOrder, startCount) {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        return "Error: 需要选中label所在的文本框";
    }

    // 筛选出textframe类型
    var textFrames = [];
    for (var i = 0; i < selection.length; i++) {
        if (selection[i].typename === "TextFrame") {
            textFrames.push(selection[i]);
        }
    }

    if (textFrames.length === 0) {
        return "Error: 需要选中label所在的文本框";
    }

    startCount = parseInt(startCount) || 1;
    var startIndex = startCount - 1;

    var templates = {
        "A": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a": "abcdefghijklmnopqrstuvwxyz",
        "A)": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "a)": "abcdefghijklmnopqrstuvwxyz"
    };

    var labels = templates[labelTemplate] || templates["A"];

    // 对textframe进行排序
    var ordered = getOrderedTextFrames(textFrames, order || "stacking", !!reverseOrder);

    for (var j = 0; j < ordered.length; j++) {
        try {
            var textFrame = ordered[j];
            var labelIndex = (startIndex + j) % labels.length;
            var label = labels[labelIndex];

            if (labelTemplate === "A)" || labelTemplate === "a)") {
                label += ")";
            }

            // 更新文本内容
            textFrame.contents = label;

            // 更新字体样式
            textFrame.textRange.characterAttributes.size = fontSize;
            try {
                var fontName = fontFamily === "Arial" ? "ArialMT" : fontFamily;
                // If bold is requested, try to find the bold version of the font
                if (fontBold) {
                    // Try different bold font name patterns
                    var boldFontNames = [
                        fontFamily + "-BoldMT",
                        fontFamily + "-Bold",
                        fontFamily + " Bold",
                        fontName + "-Bold",
                        fontName + "Bold"
                    ];

                    var fontFound = false;
                    for (var k = 0; k < boldFontNames.length; k++) {
                        try {
                            textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(boldFontNames[k]);
                            fontFound = true;
                            break;
                        } catch (e) {
                            // Continue trying other names
                        }
                    }

                    // If no bold font found, use regular font
                    if (!fontFound) {
                        textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontName);
                    }
                } else {
                    textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName(fontName);
                }
            } catch (e) {
                // 如果字体不存在，使用默认字体
                try {
                    textFrame.textRange.characterAttributes.textFont = app.textFonts.getByName("ArialMT");
                } catch (e2) {
                    // 如果ArialMT也不存在，使用第一个可用字体
                    if (app.textFonts.length > 0) {
                        textFrame.textRange.characterAttributes.textFont = app.textFonts[0];
                    }
                }
            }
        } catch (e) {
            return "Error: Error updating text frame " + (j + 1) + ": " + e.message;
        }
    }

    return "Success|" + ordered.length;
}

// 为textframe专门的排序函数
function getOrderedTextFrames(textFrames, order, reverse) {
    var arr = [];
    for (var i = 0; i < textFrames.length; i++) arr.push(textFrames[i]);

    var ord = order || "stacking";
    if (ord === "horizontal" || ord === "vertical") {
        arr.sort(function (a, b) {
            var boundsA = a.geometricBounds; // textframe使用geometricBounds即可
            var boundsB = b.geometricBounds;
            var leftA = boundsA[0];
            var topA = boundsA[1];
            var leftB = boundsB[0];
            var topB = boundsB[1];

            if (ord === "horizontal") {
                if (Math.abs(topA - topB) < 1) { // 同一行，按左边位置排序
                    return leftA - leftB;
                } else {
                    return topB - topA; // 不同行，按从上到下排序
                }
            } else { // vertical
                if (Math.abs(leftA - leftB) < 1) { // 同一列，按上边位置排序
                    return topB - topA;
                } else {
                    return leftA - leftB; // 不同列，按从左到右排序
                }
            }
        });
    } // stacking: 保持原顺序

    if (reverse) {
        var i = 0, j = arr.length - 1, tmp;
        while (i < j) {
            tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
            i++; j--;
        }
    }
    return arr;
}

function filterTextFrames() {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (selection.length === 0) {
        return "Error: 请先选择一些对象";
    }

    // 筛选出所有的文本框
    var textFrames = [];
    for (var i = 0; i < selection.length; i++) {
        if (selection[i].typename === "TextFrame") {
            textFrames.push(selection[i]);
        }
    }

    if (textFrames.length === 0) {
        return "Error: 选中的对象中没有文本框";
    }

    // 清空当前选择
    doc.selection = null;

    // 重新选择只包含文本框的对象
    for (var j = 0; j < textFrames.length; j++) {
        textFrames[j].selected = true;
    }

    return "Success|" + textFrames.length;
}

function copyRelativePosition(corner, order, reverseOrder, useArtboardRef) {
    if (app.documents.length === 0) return "Error: No document open.";

    var doc = app.activeDocument;
    var selection = doc.selection;

    if (!selection || selection.length === 0) {
        return "Error: Please select at least one item.";
    }

    // 当仅选中 1 个对象时：复制其“相对于画板”的位置（按所选角点）
    if (selection.length === 1) {
        var it = selection[0];
        var b = getVisibleBounds(it) || it.visibleBounds;
        var x, y;
        switch (corner) {
            case "TR": x = b[2]; y = b[1]; break;
            case "BL": x = b[0]; y = b[3]; break;
            case "BR": x = b[2]; y = b[3]; break;
            default: x = b[0]; y = b[1]; break; // TL
        }
        var abIndex = useArtboardRef ? app.activeDocument.artboards.getActiveArtboardIndex() : getItemArtboardIndex(it);
        var abRect = app.activeDocument.artboards[abIndex].artboardRect; // [L, T, R, B]
        // 以画板左上为原点，X 向右为正，Y 向下为正
        var relXmm = pointsToMm(x - abRect[0]);
        var relYmm = pointsToMm(abRect[1] - y);
        return '{"abs":true,"x":' + relXmm + ',"y":' + relYmm + ',"ab":' + abIndex + '}';
    }

    // useArtboardRef 多选：将所有选中的形状位置复制为“相对于当前活动画板”的坐标列表
    if (useArtboardRef && selection.length > 1) {
        var activeAbIdx = app.activeDocument.artboards.getActiveArtboardIndex();
        var activeAbRect = app.activeDocument.artboards[activeAbIdx].artboardRect; // [L, T, R, B]

        var ordCopy = order || "stacking";
        var revOrdCopy = !!reverseOrder;
        var orderedCopy = getOrderedSelection(selection, ordCopy, revOrdCopy);

        var partsAbs = [];
        for (var m = 0; m < orderedCopy.length; m++) {
            var it = orderedCopy[m];
            var bb = getVisibleBounds(it) || it.visibleBounds;
            var cx, cy;
            switch (corner) {
                case "TR": cx = bb[2]; cy = bb[1]; break;
                case "BL": cx = bb[0]; cy = bb[3]; break;
                case "BR": cx = bb[2]; cy = bb[3]; break;
                default: cx = bb[0]; cy = bb[1]; break; // TL
            }
            var relXmmM = pointsToMm(cx - activeAbRect[0]);
            var relYmmM = pointsToMm(activeAbRect[1] - cy);
            partsAbs.push('{"abs":true,"x":' + relXmmM + ',"y":' + relYmmM + ',"ab":' + activeAbIdx + '}');
        }
        return '[' + partsAbs.join(',') + ']';
    }

    // 其余情况：沿用相对位置复制逻辑
    var ord = order || "stacking";
    var revOrd = !!reverseOrder;
    var ordered = getOrderedSelection(selection, ord, revOrd);

    // 确定参考对象 (refItem)
    // 对于堆叠顺序 (stacking)，参考对象默认为最后一个，否则为第一个
    var refItem = (ord === "stacking") ? ordered[ordered.length - 1] : ordered[0];

    // 其他所有对象为目标对象 (objItems)
    var objItems = [];
    for (var i = 0; i < ordered.length; i++) {
        if (ordered[i] !== refItem) {
            objItems.push(ordered[i]);
        }
    }

    // 使用可视边界，适配剪切蒙版/复合路径
    var refB = getVisibleBounds(refItem) || refItem.visibleBounds;
    var deltas = [];

    // 遍历所有目标对象，计算相对位置
    for (var j = 0; j < objItems.length; j++) {
        var objItem = objItems[j];
        var objB = getVisibleBounds(objItem) || objItem.visibleBounds;

        var x1, y1, x2, y2;
        // 基于角点取坐标
        switch (corner) {
            case "TR": x1 = refB[2]; y1 = refB[1]; x2 = objB[2]; y2 = objB[1]; break;
            case "BL": x1 = refB[0]; y1 = refB[3]; x2 = objB[0]; y2 = objB[3]; break;
            case "BR": x1 = refB[2]; y1 = refB[3]; x2 = objB[2]; y2 = objB[3]; break;
            default: x1 = refB[0]; y1 = refB[1]; x2 = objB[0]; y2 = objB[1]; break; // TL
        }

        var deltaX = x2 - x1;
        var deltaY = y2 - y1;

        deltas.push({
            deltaX: pointsToMm(deltaX),
            deltaY: pointsToMm(deltaY)
        });
    }

    return simpleJsonStringify(deltas);
}

function pasteRelativePosition(deltasJSON, reverse, corner, order, reverseOrder, overrideDeltaX, overrideDeltaY, allowMismatch, useArtboardRef) {
    if (app.documents.length === 0) return "Error: No document open.";

    // 允许 0 值作为覆盖坐标（只要不是 null 且是数字）
    var useOverride = (overrideDeltaX !== null && overrideDeltaY !== null &&
        !isNaN(overrideDeltaX) && !isNaN(overrideDeltaY));

    var doc = app.activeDocument;
    var selection = doc.selection;

    // 解析传入数据，支持绝对位置对象或相对位移数组
    var data = null;
    if (deltasJSON && deltasJSON !== '[]') {
        try {
            data = eval('(' + deltasJSON + ')');
        } catch (e) {
            // 保持为 null，后续分支会处理
        }
    }
    var isAbs = (data && typeof data === "object" && data.abs === true);
    var isAbsArray = (data && typeof data.length !== "undefined" && data.length > 0 && typeof data[0].x !== "undefined");

    // 绝对位置粘贴：支持 单对象 abs、abs 数组、或在 useArtboardRef 勾选下使用覆盖坐标
    if (isAbs || isAbsArray || (useArtboardRef && useOverride)) {
        if (!selection || selection.length === 0) {
            return "Error: Please select items to move.";
        }

        // 使用排序后的选择，保证与复制/用户期望的一致顺序
        var ordAbs = order || "stacking";
        var revOrdAbs = !!reverseOrder;
        var orderedAbs = getOrderedSelection(selection, ordAbs, revOrdAbs);

        // 覆盖坐标：所有对象使用相同的画板相对坐标（各自画板）
        if (useArtboardRef && useOverride) {
            var ox = overrideDeltaX;
            var oy = overrideDeltaY;
            for (var i = 0; i < orderedAbs.length; i++) {
                var obj = orderedAbs[i];
                var objB = getVisibleBounds(obj) || obj.visibleBounds;

                var objAbIdx = getItemArtboardIndex(obj);
                var objAbRect = doc.artboards[objAbIdx].artboardRect; // [L, T, R, B]
                var targetXAbs = objAbRect[0] + mmToPoints(ox);
                var targetYAbs = objAbRect[1] - mmToPoints(oy);

                switch (corner) {
                    case "TR":
                        obj.translate(targetXAbs - objB[2], targetYAbs - objB[1]);
                        break;
                    case "BL":
                        obj.translate(targetXAbs - objB[0], targetYAbs - objB[3]);
                        break;
                    case "BR":
                        obj.translate(targetXAbs - objB[2], targetYAbs - objB[3]);
                        break;
                    default: // TL
                        obj.translate(targetXAbs - objB[0], targetYAbs - objB[1]);
                        break;
                }
            }
            return "Success";
        }

        // 单对象 abs：所有对象贴到统一画板相对坐标（各自画板）
        if (isAbs) {
            var targetXmm = data.x;
            var targetYmm = data.y;
            for (var j = 0; j < orderedAbs.length; j++) {
                var obj1 = orderedAbs[j];
                var objB1 = getVisibleBounds(obj1) || obj1.visibleBounds;

                var objAbIdx1 = getItemArtboardIndex(obj1);
                var objAbRect1 = doc.artboards[objAbIdx1].artboardRect;
                var targetXAbs1 = objAbRect1[0] + mmToPoints(targetXmm);
                var targetYAbs1 = objAbRect1[1] - mmToPoints(targetYmm);

                switch (corner) {
                    case "TR":
                        obj1.translate(targetXAbs1 - objB1[2], targetYAbs1 - objB1[1]);
                        break;
                    case "BL":
                        obj1.translate(targetXAbs1 - objB1[0], targetYAbs1 - objB1[3]);
                        break;
                    case "BR":
                        obj1.translate(targetXAbs1 - objB1[2], targetYAbs1 - objB1[3]);
                        break;
                    default: // TL
                        obj1.translate(targetXAbs1 - objB1[0], targetYAbs1 - objB1[1]);
                        break;
                }
            }
            return "Success";
        }

        // abs 数组：每个对象使用对应条目的画板相对坐标（可循环）
        var absArr = data;
        if ((orderedAbs.length !== absArr.length) && !allowMismatch) {
            return "Error: The number of items to move (" + orderedAbs.length + ") does not match the saved data count (" + absArr.length + ").";
        }
        for (var k = 0; k < orderedAbs.length; k++) {
            var entry = absArr[k % absArr.length];
            var obj2 = orderedAbs[k];
            var objB2 = getVisibleBounds(obj2) || obj2.visibleBounds;

            var objAbIdx2 = getItemArtboardIndex(obj2);
            var objAbRect2 = doc.artboards[objAbIdx2].artboardRect;
            var targetXAbs2 = objAbRect2[0] + mmToPoints(entry.x);
            var targetYAbs2 = objAbRect2[1] - mmToPoints(entry.y);

            switch (corner) {
                case "TR":
                    obj2.translate(targetXAbs2 - objB2[2], targetYAbs2 - objB2[1]);
                    break;
                case "BL":
                    obj2.translate(targetXAbs2 - objB2[0], targetYAbs2 - objB2[3]);
                    break;
                case "BR":
                    obj2.translate(targetXAbs2 - objB2[2], targetYAbs2 - objB2[3]);
                    break;
                default: // TL
                    obj2.translate(targetXAbs2 - objB2[0], targetYAbs2 - objB2[1]);
                    break;
            }
        }
        return "Success";
    }

    // 相对位置粘贴
    // 当未复制相对数据但提供了覆盖数值时，也允许继续（覆盖作为相对位移）
    var deltas;
    if (useOverride) {
        deltas = [{ deltaX: overrideDeltaX, deltaY: overrideDeltaY }];
    } else {
        if (!deltasJSON) return "Error: No relative position data provided.";
        try {
            deltas = data || eval('(' + deltasJSON + ')');
            if (!deltas || typeof deltas.length === "undefined") throw new Error("Invalid data format.");
        } catch (e) {
            return "Error: Invalid relative position data. " + e.message;
        }
        if (deltas.length === 0) {
            return "Error: No relative position data provided.";
        }
    }

    if (!selection || selection.length < 2) {
        return "Error: Please select at least two items.";
    }

    if (!useOverride && (selection.length - 1 !== deltas.length) && !allowMismatch) {
        return "Error: The number of items to move (" + (selection.length - 1) + ") does not match the saved data count (" + deltas.length + ").";
    }

    var ord = order || "stacking";
    var revOrd = !!reverseOrder;

    var ordered = getOrderedSelection(selection, ord, revOrd);

    var newReference = (ord === "stacking") ? ordered[ordered.length - 1] : ordered[0];

    var objectsToMove = [];
    for (var i = 0; i < ordered.length; i++) {
        if (ordered[i] !== newReference) {
            objectsToMove.push(ordered[i]);
        }
    }

    var refBounds = getVisibleBounds(newReference) || newReference.visibleBounds;

    for (var k = 0; k < objectsToMove.length; k++) {
        var objectToMove = objectsToMove[k];
        var objBounds = getVisibleBounds(objectToMove) || objectToMove.visibleBounds;

        var idx = k % deltas.length;
        var delta = deltas[idx];
        var deltaXPt = mmToPoints(delta.deltaX);
        var deltaYPt = mmToPoints(delta.deltaY);

        var newX, newY;

        switch (corner) {
            case "TR":
                newX = refBounds[2] + deltaXPt; newY = refBounds[1] + deltaYPt;
                objectToMove.translate(newX - objBounds[2], newY - objBounds[1]);
                break;
            case "BL":
                newX = refBounds[0] + deltaXPt; newY = refBounds[3] + deltaYPt;
                objectToMove.translate(newX - objBounds[0], newY - objBounds[3]);
                break;
            case "BR":
                newX = refBounds[2] + deltaXPt; newY = refBounds[3] + deltaYPt;
                objectToMove.translate(newX - objBounds[2], newY - objBounds[3]);
                break;
            default: // TL
                newX = refBounds[0] + deltaXPt; newY = refBounds[1] + deltaYPt;
                objectToMove.translate(newX - objBounds[0], newY - objBounds[1]);
                break;
        }
    }

    return "Success";
}

function copySize() {
    if (app.documents.length === 0) return "Error: No document open.";
    var selection = app.activeDocument.selection;
    if (selection.length === 0) return "Error: Please select an item.";

    var item = selection[0];
    var info = getVisibleInfo(item);

    var size = {
        width: pointsToMm(info.width),
        height: pointsToMm(info.height)
    };
    return '{"width":' + size.width + ',"height":' + size.height + '}';
}

function pasteSize(width, height, useW, useH) {
    if (app.documents.length === 0) return "Error: No document open.";

    var selection = app.activeDocument.selection;
    if (selection.length === 0) return "Error: Please select items to resize.";

    if (!useW && !useH) return "Success: No action taken.";

    var targetWidthPt = useW ? mmToPoints(width) : 0;
    var targetHeightPt = useH ? mmToPoints(height) : 0;

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        var info = getVisibleInfo(item);

        if (info.width <= 0 || info.height <= 0) continue;

        var scaleX = 100, scaleY = 100;

        if (useW && useH) {
            // Both are checked, non-uniform scale
            scaleX = (targetWidthPt / info.width) * 100;
            scaleY = (targetHeightPt / info.height) * 100;
        } else if (useW) {
            // Only width is checked, uniform scale
            scaleX = scaleY = (targetWidthPt / info.width) * 100;
        } else if (useH) {
            // Only height is checked, uniform scale
            scaleX = scaleY = (targetHeightPt / info.height) * 100;
        }

        item.resize(scaleX, scaleY, true, true, true, true, 100, Transformation.CENTER);
    }
    return "Success";
}

/**
 * Swap positions of exactly two selected items based on their visible top-left corners.
 * Returns "Success" or "Error: ..." string for host to handle.
 */
function swapSelectedPositions() {
    if (app.documents.length === 0) return "Error: No document open.";
    var selection = app.activeDocument.selection;
    if (!selection || selection.length !== 2) {
        return "Error: Please select exactly two items.";
    }

    var a = selection[0];
    var b = selection[1];

    // Record original visible top-lefts before any movement
    var infoA = getVisibleInfo(a);
    var infoB = getVisibleInfo(b);

    // Move each to the other's original position
    moveItemTopLeftTo(a, infoB.left, infoB.top);
    moveItemTopLeftTo(b, infoA.left, infoA.top);

    return "Success";
}

/**
 * Update label offsets for recently added labels in real-time
 * This function updates the position of all text items in the document
 * based on new offset values, calculating from the original base position
 */
function updateLabelOffsets(newOffsetX, newOffsetY, sessionId) {
    if (app.documents.length === 0) return "Error: No document open.";
    var doc = app.activeDocument;
    var textFrames = doc.textFrames;
    if (textFrames.length === 0) {
        return "Error: No text labels found to update.";
    }
    var sid = (typeof sessionId === 'number') ? sessionId : sessionId * 1;
    var ox = newOffsetX;
    var oy = newOffsetY;

    // 遍历文本框，按会话ID筛选，并使用记录的基准点重置位置
    var updated = 0;
    for (var i = 0; i < textFrames.length; i++) {
        var tf = textFrames[i];
        var noteStr = '';
        try { noteStr = tf.note || ''; } catch (e) { noteStr = ''; }
        if (!noteStr) continue;
        // 解析 JSON
        var s = null;
        try { s = eval('(' + noteStr + ')'); } catch (e) { s = null; }
        if (!s) continue;
        if (sid && s.sid !== sid) continue; // 只更新当前会话新增的标签
        // 基于基准位置 + 新偏移设置
        tf.left = s.baseL + ox;
        tf.top = s.baseT - oy;
        updated++;
    }
    if (updated === 0) return "Error: No labels matched current session.";
    return "Success";
}
