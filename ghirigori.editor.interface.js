/**
 * Ghirigori - draw and animate objects over web pages.
 * Copyright (C) 2011 Giacomo Berardi
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @fileOverview Editor interface.
 * @author <a href="mailto:barnets@gmail.com">Giacomo Berardi</a>
 * @version 0.1
 */


/** Editor interface (GUI) definition. */
GhiriGori.Editor = function()
{
    /**
     * Changes display property in the element style to none, or from none to a value.
     * @param {Object} elem Element to invert display.
     * @param {String} value A correct value for display css property.
     * @return {Function} Function that makes this change on the element.
     */
    var change_display = function(elem, value)
    {
        return (function()
        {
            elem.style.display = (elem.style.display != "none") ? "none" : value;
        });
    }

    var link_decoration = function(elem)
    {
        elem.onmouseover = function() {this.style.color = "DodgerBlue";}
        elem.onmouseout = function() {this.style.color = GhiriGori.fontColor;}
    }

    /**
     * Creates a graphical increaser/decreaser of input values in a text field.
     * @param {Object} elem Element to 
     * @param {Number} value Step value to increase/decrease.
     * @return {Object} Image element to put near the text field.
     */ 
    this.increaser = function(elem, step)
    {
        var incr = document.createElement("img");
        incr.src = "images/increaser.png";
        incr.style.verticalAlign = ((parseFloat(elem.style.verticalAlign) || 0) - 5) + "px";
        incr.style.border = "none";
        incr.style.padding = incr.style.margin = "0";
        incr.style.marginLeft = "2px";
        incr.style.marginRight = elem.style.marginRight;
        incr.style.right = elem.style.right;
        elem.style.marginRight = elem.style.right = "0";
        incr.onclick = function(clickEvent)
        {
            clickEvent = clickEvent || window.event;
            var offsetY = clickEvent.clientY - GhiriGori.find_y(this);
            if (offsetY <= incr.height / 2) {
                elem.value = (parseFloat(elem.value) + step).toFixed((step % 1 > 0) ? 1 : 0);
            } else {
                elem.value = (parseFloat(elem.value) - step).toFixed((step % 1 > 0) ? 1 : 0);
            }
            elem.onkeyup();
            elem.onchange();
        }
        elem.onkeydown = function(keyEvent)
        {
            switch (keyEvent.which) {
                case 38:
                    this.value = (parseFloat(this.value) + step).toFixed((step % 1 > 0) ? 1 : 0);
                    break;
                case 40:
                    this.value = (parseFloat(this.value) - step).toFixed((step % 1 > 0) ? 1 : 0);
                    break;
            }
        }
        return incr;
    }

    this.color_picker = function(elem)
    {
        var colPick = document.createElement("a");
        colPick.appendChild(document.createElement("img"));
        colPick.lastChild.src = "images/colorsThumb.png";
        colPick.lastChild.style.border = "none";
        colPick.lastChild.style.padding = colPick.lastChild.style.margin = "0";
        colPick.lastChild.style.verticalAlign = "-2px";
        colPick.href = "javascript:void(0)";
        colPick.title = "Use color wheel";
        //colPick.style.color = GhiriGori.fontColor;
        //link_decoration(colPick);
        colPick.style.border = "none";
        colPick.style.padding = colPick.style.margin = "0";
        colPick.style.marginLeft = "4px";
        colPick.style.marginRight = elem.style.marginRight;
        colPick.style.right = elem.style.right;
        elem.style.marginRight = elem.style.right = "0";
        var colors = document.createElement("img");
        colors.src = "images/colors.png";
        colors.style.border = "none";
        colors.style.position = "absolute";
        colors.style.padding = colors.style.margin = "0";
        colors.style.cursor = "crosshair";
        var hideFun = change_display(colors, "block");
        colors.onmouseout = hideFun;
        colors.onclick = function(clickEvent)
        {
            clickEvent = clickEvent || window.event;
            var x = clickEvent.clientX - GhiriGori.find_x(this), y = clickEvent.clientY - GhiriGori.find_y(this);
            var cenX = cenY = this.width / 2;
            var width4 = this.width / 4;
            var cenDist = Math.sqrt(Math.pow(x - cenX, 2) + Math.pow(y - cenY, 2));
            //if (cenDist > this.width / 2 + 5) {
            //    hideFun();
            //    return;
            //}
            var hue = Math.atan2(x - cenX, cenY - y) / (Math.PI * 2);
            var hsv =
            {
                h: hue > 0 ? (hue * 360) : ((hue * 360) + 360),
                s: cenDist < width4 ? (cenDist / width4) * 100 : 100,
                v: cenDist >= width4 ? Math.max(0, 1 - ((cenDist - width4) / (cenX - width4))) * 100 : 100
            };
            elem.value = GhiriGori.hsv_to_hex(hsv);
            elem.onkeyup();
            elem.onchange();
        }
        colPick.onclick = function(clickEvent)
        {
            hideFun();
            if (colors.display != "none") {
                clickEvent = clickEvent || window.event;
                colors.style.left = clickEvent.clientX + 12 + "px";
                colors.style.top = clickEvent.clientY - colors.width / 2 + "px";
            }
        }
        elem.onkeydown = function(keyEvent)
        {
            if (keyEvent.metaKey) {
                switch (keyEvent.which) {
                    case 37:
                        var col = GhiriGori.hex_to_hsv(this.value);
                        --col.h;
                        col.h = (col.h < 0) ? 0 : col.h;
                        this.value = GhiriGori.hsv_to_hex(col);
                        this.onkeyup();
                        this.onchange();
                        return;
                    case 39:
                        var col = GhiriGori.hex_to_hsv(this.value);
                        ++col.h;
                        col.h = (col.h > 360) ? 360 : col.h;
                        this.value = GhiriGori.hsv_to_hex(col);
                        this.onkeyup();
                        this.onchange();
                        return;
                }
            }
            switch (keyEvent.which) {
                case 40:
                    var col = GhiriGori.hex_to_hsv(this.value);
                    (col.v == 100 && col.s < 100) ? col.s++ : col.v--;
                    this.value = GhiriGori.hsv_to_hex(col);
                    this.onkeyup();
                    this.onchange();
                    return;
                case 38:
                    var col = GhiriGori.hex_to_hsv(this.value);
                    (col.v == 100 && col.s > 0) ? col.s-- : col.v++;
                    this.value = GhiriGori.hsv_to_hex(col);
                    this.onkeyup();
                    this.onchange();
                    return;
            }
        }
        hideFun();
        elem.parentNode.appendChild(colPick);
        document.body.parentNode.appendChild(colors);
        return colors;
    }

    /**
     * Text field content selector, it appears under the text field.
     * @constructor
     * @param {Object} elem Input DOM element.
     */
    var Selector = function(elem)
    {
        this.sel = document.createElement("div");
        this.sel.style.position = "absolute";
        this.sel.style.backgroundColor = "white";
        this.sel.style.padding = "4px";
        this.sel.style.fontSize = GhiriGori.fontSize + "px";
        this.sel.style.border = "1px solid " + GhiriGori.fontColor;
        this.sel.style.left = (GhiriGori.find_x(elem) + 2) + "px";
        this.sel.style.top = GhiriGori.find_y(elem) + GhiriGori.fontSize + 10 + "px";
        this.sel.style.postion = "absolute";

        this.update = function(list)
        {
            while (this.sel.childNodes.length >= 1) this.sel.removeChild(this.sel.firstChild);
            for (var i = list.length-1; i >= 0; i--) {
                var p = document.createElement("a");
                link_decoration(p);
                p.href = "javascript:void(0)";
                p.style.color = GhiriGori.fontColor;
                p.innerHTML = list[i];
                p.onclick = function() {elem.value = this.innerHTML;}
                this.sel.appendChild(p);
                if (i > 0) this.sel.appendChild(document.createElement("br"));
            }
        }

        this.current = function()
        {
            return elem.value;    
        }

        this.clean = function()
        {
            elem.value = "";    
        }

        this.sel.onclick = elem.onclick = change_display(this.sel, "block");
        elem.onclick();
        document.body.parentNode.appendChild(this.sel);
    }

    this.clear = function()
    {
        document.body.style.marginTop = ((parseInt(document.body.style.marginTop) || 0) - GhiriGori.bodyOffset) + "px";
        document.body.parentNode.removeChild(colorPicker);
        document.body.parentNode.removeChild(this.selector.sel);
        document.body.removeChild(topWindow);
        document.body.removeChild(instrWindow);
        document.body.removeChild(timelWindow);
    }

    // Disable text selection.
    document.onselectstart = function() {return false;}
    //document.onmousedown = function() {return false;}

    // Make space for the top menu panel.
    document.body.style.marginTop = ((parseInt(document.body.style.marginTop) || 0) + GhiriGori.bodyOffset) + "px";

//FIXME: all this code for the interface should be write in html!

    // Top panel initialization.
    var topWindow = document.createElement("div");
    topWindow.style.position = "fixed";
    topWindow.style.margin = topWindow.style.top = "0";
    topWindow.style.padding = "2px";
    topWindow.style.backgroundColor = "White";
    topWindow.style.color = GhiriGori.fontColor;
    topWindow.style.fontSize = GhiriGori.fontSize + "px";
    topWindow.style.textAlign = "left";
    topWindow.style.border = "solid 2px DodgerBlue";
    topWindow.style.cursor = "default";
    var topTitle = document.createElement("span");
    topTitle.innerHTML = "GhiriGori";
    topTitle.style.color = "red";
    topTitle.style.verticalAlign = "5px";
    topTitle.style.margin = "5px";
    topWindow.appendChild(topTitle);

    this.newButt = document.createElement("a");
    this.newButt.href = "javascript:void(0)";
    this.newButt.title = "Create new project";
    this.newButt.appendChild(document.createElement("img"));
    this.newButt.firstChild.src = "images/new.png"; 
    this.newButt.firstChild.style.border = "none";
    this.newButt.firstChild.style.padding = this.newButt.firstChild.style.margin = this.newButt.style.padding = "0";
    this.newButt.style.margin = "0 3px 0 3px";
    topWindow.appendChild(this.newButt);

    this.openButt = document.createElement("a");
    this.openButt.href = "javascript:void(0)";
    this.openButt.title = "Open existing project"; 
    this.openButt.appendChild(document.createElement("img"));
    this.openButt.firstChild.src = "images/open.png"; 
    this.openButt.firstChild.style.border = "none";
    this.openButt.firstChild.style.padding = this.openButt.firstChild.style.margin = this.openButt.style.padding = "0";
    this.openButt.style.margin = "0 3px 0 3px";
    topWindow.appendChild(this.openButt);

    this.deleteButt = document.createElement("a");
    this.deleteButt.href = "javascript:void(0)";
    this.deleteButt.title = "Delete current project"; 
    this.deleteButt.appendChild(document.createElement("img"));
    this.deleteButt.firstChild.src = "images/delete.png"; 
    this.deleteButt.firstChild.style.border = "none";
    this.deleteButt.firstChild.style.padding = this.deleteButt.firstChild.style.margin = this.deleteButt.style.padding = "0";
    this.deleteButt.style.margin = "0 3px 0 3px";
    topWindow.appendChild(this.deleteButt);

//    var saveasButt = document.createElement("img");
//    saveasButt.src = "images/saveas.png"; 
//    saveasButt.alt = saveasButt.title = "Save as... current project"; 
//    saveasButt.style.border = "0px none";
//    saveasButt.style.padding = saveasButt.style.margin = "0";
//    topWindow.appendChild(saveasButt);
    this.saveButt = document.createElement("a");
    this.saveButt.href = "javascript:void(0)";
    this.saveButt.title = "Save current project";
    this.saveButt.appendChild(document.createElement("img"));
    this.saveButt.firstChild.src = "images/save.png"; 
    this.saveButt.firstChild.style.border = "none";
    this.saveButt.firstChild.style.padding = this.saveButt.firstChild.style.margin = this.saveButt.style.padding = "0";
    this.saveButt.style.margin = "0 3px 0 3px";
    topWindow.appendChild(this.saveButt);

    this.saveInput = document.createElement("input");
    this.saveInput.type = "text";
    this.saveInput.size = "15";
    this.saveInput.maxLength = "15";
    this.saveInput.style.border = "1px solid DimGray";
    this.saveInput.style.color = GhiriGori.fontColor;
    this.saveInput.style.fontSize = GhiriGori.fontSize + "px";
    this.saveInput.style.verticalAlign = "5px";
    this.saveInput.style.margin = "0 3px 0 3px";
    topWindow.appendChild(this.saveInput);

    this.undoButt = document.createElement("a");
    this.undoButt.href = "javascript:void(0)";
    this.undoButt.title = "Undo last change";
    this.undoButt.appendChild(document.createElement("img"));
    this.undoButt.firstChild.src = "images/undo.png"; 
    this.undoButt.firstChild.style.border = "none";
    this.undoButt.firstChild.style.padding = this.undoButt.firstChild.style.margin = this.undoButt.style.padding = "0";
    this.undoButt.style.margin = "0 0 0 5px";
    topWindow.appendChild(this.undoButt);

    this.redoButt = document.createElement("a");
    this.redoButt.href = "javascript:void(0)";
    this.redoButt.title = "Redo last change";
    this.redoButt.appendChild(document.createElement("img"));
    this.redoButt.firstChild.src = "images/redo.png"; 
    this.redoButt.firstChild.style.border = "none";
    this.redoButt.firstChild.style.padding = this.redoButt.firstChild.style.margin = this.redoButt.style.padding = "0";
    this.redoButt.style.margin = "0 5px 0 0";
    topWindow.appendChild(this.redoButt);

    var instrLabel = document.createElement("a");
    instrLabel.href = "javascript:void(0)";
    instrLabel.innerHTML = "Instruments";
    instrLabel.style.verticalAlign = "5px";
    instrLabel.style.margin = "0 5px 0 5px";
    instrLabel.style.color = GhiriGori.fontColor;
    instrLabel.style.textDecoration = "none";
    link_decoration(instrLabel);
    topWindow.appendChild(instrLabel);

    var timelLabel = document.createElement("a");
    timelLabel.href = "javascript:void(0)";
    timelLabel.innerHTML = "Timeline";
    timelLabel.style.verticalAlign = "5px";
    timelLabel.style.marginRight = "5px";
    timelLabel.style.color = GhiriGori.fontColor;
    timelLabel.style.textDecoration = "none";
    link_decoration(timelLabel);
    topWindow.appendChild(timelLabel);

    var helpLabel = document.createElement("a");
    helpLabel.href = "javascript:void(0)";
    helpLabel.innerHTML = "Help";
    helpLabel.style.verticalAlign = "5px";
    helpLabel.style.marginRight = "5px";
    helpLabel.style.color = GhiriGori.fontColor;
    helpLabel.style.textDecoration = "none";
    link_decoration(helpLabel);
    topWindow.appendChild(helpLabel);

    this.quitButt = document.createElement("a");
    this.quitButt.href = "javascript:void(0)";
    this.quitButt.title = "Quit application";
    this.quitButt.appendChild(document.createElement("img"));
    this.quitButt.firstChild.src = "images/quit.png"; 
    this.quitButt.firstChild.style.border = "none";
    this.quitButt.firstChild.style.padding = this.quitButt.firstChild.style.margin = this.quitButt.style.padding = "0";
    this.quitButt.style.margin = "0 0 0 3px";
    topWindow.appendChild(this.quitButt);

    document.body.appendChild(topWindow);

    // Instruments window initialization.

    var instrWindow = document.createElement("div");
    instrWindow.style.minWidth = "215px";
    instrWindow.style.position = "fixed";
    instrWindow.style.top = (GhiriGori.bodyOffset + 15) + "px";
    instrWindow.style.left = "5px";
    instrWindow.style.margin = "auto";
    instrWindow.style.padding = "auto";
    instrWindow.style.cursor = "default";
    instrWindow.style.color = GhiriGori.fontColor;
    instrWindow.style.backgroundColor = "White";
    instrWindow.style.fontSize = GhiriGori.fontSize + "px";
    instrWindow.style.textAlign = "left";

    var instrWinBar = document.createElement("div");
    instrWinBar.style.margin = instrWinBar.style.left = instrWinBar.style.top = "0";
    instrWinBar.style.border = "solid 2px DodgerBlue";
    instrWinBar.style.color = "red";
    instrWinBar.style.padding = "3px";
    var instrHideButt = document.createElement("a");
    instrHideButt.appendChild(document.createElement("img"));
    instrHideButt.firstChild.src = "images/hide.png";
    instrHideButt.firstChild.style.border = "none";
    instrHideButt.title = "Hide instruments window"; 
    instrHideButt.style.padding = instrHideButt.style.margin = instrHideButt.firstChild.style.padding = instrHideButt.firstChild.style.margin = "0";
    instrWinBar.appendChild(instrHideButt);
    instrWinBar.appendChild(document.createElement("span"));
    instrWinBar.lastChild.innerHTML = "Instruments";
    instrWinBar.lastChild.style.marginLeft = "8px";
    instrWinBar.lastChild.style.verticalAlign = "5px";
    instrWindow.appendChild(instrWinBar);

    var instrPanel = document.createElement("div");
    instrPanel.style.margin = instrPanel.style.left = instrPanel.style.top = "0";
    instrPanel.style.padding = "2px";
    instrPanel.style.backgroundColor = "LightGrey";
    instrWindow.appendChild(instrPanel);

    var addRemPanel = document.createElement("div");
    addRemPanel.style.backgroundColor = "White";
    addRemPanel.style.margin = "4px";
    addRemPanel.style.padding = "5px";
    addRemPanel.appendChild(document.createElement("div"));
    var addButt = document.createElement("a");
    addButt.innerHTML = "Add";
    addButt.href = "javascript:void(0)";
    addButt.title = "Choose a shape to add";
    addButt.style.color = GhiriGori.fontColor;
    addButt.style.textDecoration = "none";
    addButt.style.fontWeight = "bold";
    addButt.appendChild(document.createElement("img"));
    addButt.lastChild.src = "images/add.png";
    addButt.lastChild.style.border = "none";
    addButt.lastChild.style.padding = addButt.lastChild.style.margin = "0";
    addButt.lastChild.style.verticalAlign = "-3px";
    link_decoration(addButt);
    addRemPanel.firstChild.appendChild(addButt);
    this.remButt = document.createElement("a");
    this.remButt.innerHTML = " Remove";
    this.remButt.href = "javascript:void(0)";
    this.remButt.title = "Remove selected shape";
    this.remButt.style.color = GhiriGori.fontColor;
    this.remButt.style.textDecoration = "none";
    this.remButt.style.fontWeight = "bold";
    this.remButt.appendChild(document.createElement("img"));
    this.remButt.lastChild.src = "images/rem.png";
    this.remButt.lastChild.style.border = "none";
    this.remButt.lastChild.style.padding = this.remButt.lastChild.style.margin = "0";
    this.remButt.lastChild.style.verticalAlign = "-3px";
    link_decoration(this.remButt);
    addRemPanel.firstChild.appendChild(this.remButt);

    addPanel = document.createElement("div");
    addPanel.style.padding = "10px 2px 2px 2px";
    this.addRectButt = document.createElement("a");
    this.addRectButt.href = "javascript:void(0)";
    this.addRectButt.title = "Rectangle";
    this.addRectButt.appendChild(document.createElement("img"));
    this.addRectButt.lastChild.src = "images/rect.png";
    this.addRectButt.lastChild.style.border = "none";
    this.addRectButt.lastChild.style.padding = this.addRectButt.lastChild.style.margin = "0";
    addPanel.appendChild(this.addRectButt);
    this.addLineButt = document.createElement("a");
    this.addLineButt.style.marginLeft = "10px";
    this.addLineButt.href = "javascript:void(0)";
    this.addLineButt.title = "Line";
    this.addLineButt.appendChild(document.createElement("img"));
    this.addLineButt.lastChild.src = "images/line.png";
    this.addLineButt.lastChild.style.border = "none";
    this.addLineButt.lastChild.style.padding = this.addLineButt.lastChild.style.margin = "0";
    addPanel.appendChild(this.addLineButt);
    this.addEllipButt = document.createElement("a");
    this.addEllipButt.style.marginLeft = "10px";
    this.addEllipButt.href = "javascript:void(0)";
    this.addEllipButt.title = "Ellipse";
    this.addEllipButt.appendChild(document.createElement("img"));
    this.addEllipButt.lastChild.src = "images/ellip.png";
    this.addEllipButt.lastChild.style.border = "none";
    this.addEllipButt.lastChild.style.padding = this.addEllipButt.lastChild.style.margin = "0";
    addPanel.appendChild(this.addEllipButt);
    this.addArrButt = document.createElement("a");
    this.addArrButt.style.marginLeft = "10px";
    this.addArrButt.href = "javascript:void(0)";
    this.addArrButt.title = "Arrow";
    this.addArrButt.appendChild(document.createElement("img"));
    this.addArrButt.lastChild.src = "images/arr.png";
    this.addArrButt.lastChild.style.border = "none";
    this.addArrButt.lastChild.style.padding = this.addArrButt.lastChild.style.margin = "0";
    addPanel.appendChild(this.addArrButt);
    this.addTextButt = document.createElement("a");
    this.addTextButt.style.marginLeft = "10px";
    this.addTextButt.href = "javascript:void(0)";
    this.addTextButt.title = "Text";
    this.addTextButt.appendChild(document.createElement("img"));
    this.addTextButt.lastChild.src = "images/text.png";
    this.addTextButt.lastChild.style.border = "none";
    this.addTextButt.lastChild.style.padding = this.addTextButt.lastChild.style.margin = "0";
    addPanel.appendChild(this.addTextButt);
    addRemPanel.appendChild(addPanel);
    instrPanel.appendChild(addRemPanel);

    var modPanel = document.createElement("div");
    modPanel.style.backgroundColor = "White";
    modPanel.style.margin = "4px";
    modPanel.style.padding = "5px";
    modPanel.appendChild(document.createElement("a"));
    modPanel.firstChild.innerHTML = "Modify";
    modPanel.firstChild.href = "javascript:void(0)";
    modPanel.firstChild.title = "Show modify panel";
    modPanel.firstChild.style.color = GhiriGori.fontColor;
    modPanel.firstChild.style.textDecoration = "none";
    modPanel.firstChild.style.fontWeight = "bold";
    link_decoration(modPanel.firstChild);
    var modPanelCont = document.createElement("div");
    modPanelCont.style.padding = "6px 2px 2px 2px";

    modPanelCont.appendChild(document.createElement("div"));
    modPanelCont.lastChild.style.lineHeight = (GhiriGori.fontSize + 24) + "px";
    modPanelCont.lastChild.style.paddingRight = "7px";
    modPanelCont.lastChild.style.textAlign = "right";

    modPanelCont.lastChild.appendChild(document.createElement("span"));
    modPanelCont.lastChild.lastChild.innerHTML = "Form:";
    modPanelCont.lastChild.appendChild(document.createElement("br"));
    modPanelCont.lastChild.appendChild(document.createElement("span"));
    modPanelCont.lastChild.lastChild.innerHTML = "Copy:";
    modPanelCont.lastChild.appendChild(document.createElement("br"));

    modPanelCont.lastChild.appendChild(document.createElement("span"));
    modPanelCont.lastChild.lastChild.innerHTML = "Order:";
    modPanelCont.lastChild.appendChild(document.createElement("br"));
    modPanelCont.lastChild.appendChild(document.createElement("span"));
    modPanelCont.lastChild.lastChild.innerHTML = "Thickness:";
    modPanelCont.lastChild.appendChild(document.createElement("br"));
    modPanelCont.lastChild.appendChild(document.createElement("span"));
    modPanelCont.lastChild.lastChild.innerHTML = "Opacity:";
    modPanelCont.lastChild.appendChild(document.createElement("br"));
    modPanelCont.lastChild.appendChild(document.createElement("span"));
    modPanelCont.lastChild.lastChild.innerHTML = "Color:";
    modPanelCont.lastChild.style.cssFloat = "left";

    modPanelCont.appendChild(document.createElement("div"));

    modPanelCont.lastChild.appendChild(document.createElement("div"));
    modPanelCont.lastChild.lastChild.style.lineHeight = GhiriGori.fontSize + "px";
    modPanelCont.lastChild.lastChild.style.marginBottom = "13px";
    this.addFormButt = document.createElement("a");
    this.addFormButt.innerHTML = "<u>A</u>dd";
    this.addFormButt.href = "javascript:void(0)";
    this.addFormButt.title = "Add a form to current shape (a)";
    this.addFormButt.style.color = GhiriGori.fontColor;
    this.addFormButt.style.textDecoration = "none";
    this.addFormButt.appendChild(document.createElement("img"));
    this.addFormButt.lastChild.src = "images/add.png";
    this.addFormButt.lastChild.style.border = "none";
    this.addFormButt.lastChild.style.padding = this.addFormButt.lastChild.style.margin = "0";
    this.addFormButt.lastChild.style.verticalAlign = "-3px";
    link_decoration(this.addFormButt);
    modPanelCont.lastChild.lastChild.appendChild(this.addFormButt);
    modPanelCont.lastChild.lastChild.appendChild(document.createElement("br"));
    this.remFormButt = document.createElement("a");
    this.remFormButt.innerHTML = "<u>R</u>emove";
    this.remFormButt.href = "javascript:void(0)";
    this.remFormButt.title = "Remove selected form from current shape (r)";
    this.remFormButt.style.color = GhiriGori.fontColor;
    this.remFormButt.style.textDecoration = "none";
    this.remFormButt.appendChild(document.createElement("img"));
    this.remFormButt.lastChild.src = "images/rem.png";
    this.remFormButt.lastChild.style.border = "none";
    this.remFormButt.lastChild.style.padding = this.remFormButt.lastChild.style.margin = "0";
    this.remFormButt.lastChild.style.verticalAlign = "-3px";
    link_decoration(this.remFormButt);
    modPanelCont.lastChild.lastChild.appendChild(this.remFormButt);

    modPanelCont.lastChild.appendChild(document.createElement("div"));
    modPanelCont.lastChild.lastChild.style.lineHeight = GhiriGori.fontSize + "px";
    modPanelCont.lastChild.lastChild.style.marginBottom = "12px";
    this.copyPosButt = document.createElement("a");
    this.copyPosButt.innerHTML = "P<u>o</u>sition";
    this.copyPosButt.href = "javascript:void(0)";
    this.copyPosButt.title = "Set the same position of another form (o)";
    this.copyPosButt.style.color = GhiriGori.fontColor;
    this.copyPosButt.style.textDecoration = "none";
    link_decoration(this.copyPosButt);
    modPanelCont.lastChild.lastChild.appendChild(this.copyPosButt);
    modPanelCont.lastChild.lastChild.appendChild(document.createElement("br"));
    this.copySizeButt = document.createElement("a");
    this.copySizeButt.innerHTML = "S<u>i</u>ze";
    this.copySizeButt.href = "javascript:void(0)";
    this.copySizeButt.title = "Set the same size of another form (i)";
    this.copySizeButt.style.color = GhiriGori.fontColor;
    this.copySizeButt.style.textDecoration = "none";
    link_decoration(this.copySizeButt);
    modPanelCont.lastChild.lastChild.appendChild(this.copySizeButt);

    modPanelCont.lastChild.appendChild(document.createElement("div"));
    modPanelCont.lastChild.lastChild.style.lineHeight = GhiriGori.fontSize + "px";
    modPanelCont.lastChild.lastChild.style.marginBottom = "13px";
    this.raiseButt = document.createElement("a");
    this.raiseButt.href = "javascript:void(0)";
    this.raiseButt.title = "Raise selected shape over other shapes (Ctrl + PageUp)";
    this.raiseButt.appendChild(document.createElement("img"));
    this.raiseButt.lastChild.src = "images/raise.png";
    this.raiseButt.lastChild.style.border = "none";
    this.raiseButt.lastChild.style.padding = this.raiseButt.lastChild.style.margin = "0";
    //this.raiseButt.lastChild.style.verticalAlign = "-2px";
    modPanelCont.lastChild.lastChild.appendChild(this.raiseButt);
    this.lowerButt = document.createElement("a");
    this.lowerButt.style.marginLeft = "5px"
    this.lowerButt.href = "javascript:void(0)";
    this.lowerButt.title = "Lower selected shape under other shapes (Ctrl + PageUp)";
    this.lowerButt.appendChild(document.createElement("img"));
    this.lowerButt.lastChild.src = "images/lower.png";
    this.lowerButt.lastChild.style.border = "none";
    this.lowerButt.lastChild.style.padding = this.lowerButt.lastChild.style.margin = "0";
    //this.lowerButt.lastChild.style.verticalAlign = "-2px";
    modPanelCont.lastChild.lastChild.appendChild(this.lowerButt);

    this.lineWidthInput = document.createElement("input");
    this.lineWidthInput.type = "text";
    this.lineWidthInput.size = "3";
    this.lineWidthInput.maxLength = "3";
    this.lineWidthInput.style.border = "1px solid DimGray";
    this.lineWidthInput.style.color = GhiriGori.fontColor;
    this.lineWidthInput.style.fontSize = GhiriGori.fontSize + "px";
    this.lineWidthInput.style.marginBottom = "16px";
    modPanelCont.lastChild.appendChild(this.lineWidthInput);
    modPanelCont.lastChild.appendChild(this.increaser(this.lineWidthInput, 1));
    modPanelCont.lastChild.appendChild(document.createElement("br"));
    this.opacityInput = document.createElement("input");
    this.opacityInput.type = "text";
    this.opacityInput.size = "3";
    this.opacityInput.maxLength = "3";
    this.opacityInput.style.border = "1px solid DimGray";
    this.opacityInput.style.color = GhiriGori.fontColor;
    this.opacityInput.style.fontSize = GhiriGori.fontSize + "px";
    this.opacityInput.style.marginBottom = "16px";
    modPanelCont.lastChild.appendChild(this.opacityInput);
    modPanelCont.lastChild.appendChild(this.increaser(this.opacityInput, 0.1));
    modPanelCont.lastChild.appendChild(document.createElement("br"));
    this.colorInput = document.createElement("input");
    this.colorInput.type = "text";
    this.colorInput.size = "8";
    this.colorInput.maxLength = "7";
    this.colorInput.style.border = "1px solid DimGray";
    this.colorInput.style.color = GhiriGori.fontColor;
    this.colorInput.style.fontSize = GhiriGori.fontSize + "px";
    modPanelCont.lastChild.appendChild(this.colorInput);
    var colorPicker = this.color_picker(this.colorInput);

    /** A div containing extra fields for a specific shape, loaded in {@link create_fields} . */
    this.extraFields = document.createElement("div");
    this.extraFields.style.clear = "both";
    this.extraFields.style.paddingTop = "4px";
    this.extraFields.style.lineHeight = (GhiriGori.fontSize + 12) + "px";
    modPanelCont.appendChild(this.extraFields);
    modPanel.appendChild(modPanelCont);
    instrPanel.appendChild(modPanel);

//    var areaPanel = document.createElement("div");
//    areaPanel.style.backgroundColor = "White";
//    areaPanel.style.margin = "4px";
//    areaPanel.style.padding = "5px";
//    areaPanel.appendChild(document.createElement("div"));
//    areaPanel.firstChild.innerHTML = "Area";
//    areaPanel.appendChild(document.createElement("div"));
//    areaPanel.lastChild.innerHTML = "aaaaaaaaaaaaaaaaaa";
//    instrPanel.appendChild(areaPanel);

    document.body.appendChild(instrWindow);

    // Timeline window initialization.

    var timelWindow = document.createElement("div");
    timelWindow.style.position = "fixed";
    timelWindow.style.top = (GhiriGori.bodyOffset + 15) + "px";
    timelWindow.style.left = "230px";
    timelWindow.style.margin = "auto";
    timelWindow.style.padding = "auto";
    timelWindow.style.cursor = "default";
    timelWindow.style.color = GhiriGori.fontColor;
    timelWindow.style.backgroundColor = "LightGrey";
    timelWindow.style.fontSize = GhiriGori.fontSize + "px";
    timelWindow.style.textAlign = "left";

    var timelWinBar = document.createElement("div");
    timelWinBar.style.margin = timelWinBar.style.left = timelWinBar.style.top = "0";
    timelWinBar.style.border = "solid 2px DodgerBlue";
    timelWinBar.style.backgroundColor = "White";
    timelWinBar.style.color = "red";
    timelWinBar.style.padding = "3px";
    var timelHideButt = document.createElement("a");
    timelHideButt.appendChild(document.createElement("img"));
    timelHideButt.firstChild.src = "images/hide.png";
    timelHideButt.firstChild.style.border = "none";
    timelHideButt.title = "Hide timeline window"; 
    timelHideButt.style.padding = timelHideButt.style.margin = timelHideButt.firstChild.style.padding = timelHideButt.firstChild.style.margin = "0";
    timelWinBar.appendChild(timelHideButt);
    timelWinBar.appendChild(document.createElement("span"));
    timelWinBar.lastChild.innerHTML = "Timeline";
    timelWinBar.lastChild.style.marginLeft = "8px";
    timelWinBar.lastChild.style.verticalAlign = "5px";
    timelWindow.appendChild(timelWinBar);

    var timelPanel = document.createElement("div");
    timelPanel.style.backgroundColor = "White";
    timelPanel.style.margin = "6px";
    timelPanel.style.padding = "5px";
    timelPanel.style.left = timelPanel.style.top = "0";

    timelPanel.appendChild(document.createElement("div"));
    timelPanel.lastChild.style.cssFloat = "left";
    this.playButt = document.createElement("a");
    this.playButt.href = "javascript:void(0)";
    this.playButt.title = "Play (p)";
    this.playButt.appendChild(document.createElement("img"));
    this.playButt.lastChild.src = "images/play.png";
    this.playButt.lastChild.style.border = "none";
    this.playButt.lastChild.style.padding = this.playButt.lastChild.style.margin = "0";
    timelPanel.lastChild.appendChild(this.playButt);
    this.pauseButt = document.createElement("a");
    this.pauseButt.href = "javascript:void(0)";
    this.pauseButt.title = "Pause (p)";
    this.pauseButt.appendChild(document.createElement("img"));
    this.pauseButt.lastChild.src = "images/pause.png";
    this.pauseButt.lastChild.style.border = "none";
    this.pauseButt.lastChild.style.padding = this.pauseButt.lastChild.style.margin = "0";
    this.pauseButt.style.marginLeft = "10px";
    timelPanel.lastChild.appendChild(this.pauseButt);
    this.stopButt = document.createElement("a");
    this.stopButt.href = "javascript:void(0)";
    this.stopButt.title = "Stop / Reset animation (s)";
    this.stopButt.appendChild(document.createElement("img"));
    this.stopButt.lastChild.src = "images/stop.png";
    this.stopButt.lastChild.style.border = "none";
    this.stopButt.lastChild.style.padding = this.stopButt.lastChild.style.margin = "0";
    this.stopButt.style.marginLeft = "10px";
    timelPanel.lastChild.appendChild(this.stopButt);
    this.prevButt = document.createElement("a");
    this.prevButt.href = "javascript:void(0)";
    this.prevButt.title = "Previous shape form (b)";
    this.prevButt.appendChild(document.createElement("img"));
    this.prevButt.lastChild.src = "images/prev.png";
    this.prevButt.lastChild.style.border = "none";
    this.prevButt.lastChild.style.padding = this.prevButt.lastChild.style.margin = "0";
    this.prevButt.style.marginLeft = "10px";
    timelPanel.lastChild.appendChild(this.prevButt);
    this.nextButt = document.createElement("a");
    this.nextButt.href = "javascript:void(0)";
    this.nextButt.title = "Next shape form (n)";
    this.nextButt.appendChild(document.createElement("img"));
    this.nextButt.lastChild.src = "images/next.png";
    this.nextButt.lastChild.style.border = "none";
    this.nextButt.lastChild.style.padding = this.nextButt.lastChild.style.margin = "0";
    this.nextButt.style.marginLeft = "10px";
    timelPanel.lastChild.appendChild(this.nextButt);

    timelPanel.lastChild.appendChild(document.createElement("span"));
    timelPanel.lastChild.lastChild.innerHTML = "Initial delay: ";
    timelPanel.lastChild.lastChild.style.verticalAlign = "5px";
    timelPanel.lastChild.lastChild.style.marginLeft = "10px";
    this.startTimeInput = document.createElement("input");
    this.startTimeInput.type = "text";
    this.startTimeInput.size = "7";
    this.startTimeInput.maxLength = "7";
    this.startTimeInput.style.border = "1px solid DimGray";
    this.startTimeInput.style.color = GhiriGori.fontColor;
    this.startTimeInput.style.fontSize = GhiriGori.fontSize + "px";
    this.startTimeInput.style.verticalAlign = "5px";
    timelPanel.lastChild.appendChild(this.startTimeInput);
    timelPanel.lastChild.appendChild(this.increaser(this.startTimeInput, 1));

    timelPanel.appendChild(document.createElement("div"));
    timelPanel.lastChild.style.cssFloat = "right";
    timelPanel.lastChild.style.marginLeft = "15px";
    timelPanel.lastChild.appendChild(document.createElement("span"));
    timelPanel.lastChild.lastChild.innerHTML = "Form time: ";
    timelPanel.lastChild.lastChild.style.verticalAlign = "-4px";
    this.timeInput = document.createElement("input");
    this.timeInput.type = "text";
    this.timeInput.size = "7";
    this.timeInput.maxLength = "7";
    this.timeInput.style.border = "1px solid DimGray";
    this.timeInput.style.color = GhiriGori.fontColor;
    this.timeInput.style.fontSize = GhiriGori.fontSize + "px";
    this.timeInput.style.verticalAlign = "-4px";
    timelPanel.lastChild.appendChild(this.timeInput);
    timelPanel.lastChild.appendChild(this.increaser(this.timeInput, 1));

    this.timelineCanvas = document.createElement("canvas");
    this.timelineCanvas.width = 600;
    this.timelineCanvas.height = 100;
    var timelCont = document.createElement("div");
    timelCont.style.padding = "30px 0 4px 0";
    timelCont.appendChild(this.timelineCanvas);
    timelPanel.appendChild(timelCont);

    this.timelHeightIncr = document.createElement("div");
    this.timelHeightIncr.style.width = (this.timelineCanvas.width / 2 - 2) + "px";
    this.timelHeightIncr.style.height = "15px";
    this.timelHeightIncr.style.backgroundColor = "LightGray";
    this.timelHeightIncr.onmouseover = function()
    {
        this.style.cursor="s-resize";
        this.style.backgroundColor = "DodgerBlue";
    }
    this.timelHeightIncr.onmouseout = function()
    {
        this.style.cursor="default";
        this.style.backgroundColor = "LightGray";
    }
    this.timelWidthIncr = document.createElement("div");
    this.timelWidthIncr.style.cssFloat = "right";
    this.timelWidthIncr.style.width = this.timelHeightIncr.style.width;
    this.timelWidthIncr.style.height = this.timelHeightIncr.style.height;
    this.timelWidthIncr.style.backgroundColor = "LightGray";
    this.timelWidthIncr.onmouseover = function()
    {
        this.style.cursor="e-resize";
        this.style.backgroundColor = "DodgerBlue";
    }
    this.timelWidthIncr.onmouseout = this.timelHeightIncr.onmouseout;
    timelPanel.appendChild(this.timelWidthIncr);
    timelPanel.appendChild(this.timelHeightIncr);

    timelWindow.appendChild(timelPanel);

    document.body.appendChild(timelWindow);

    // Help window initialization

    var helpWindow = document.createElement("div");
    helpWindow.style.position = "fixed";
    helpWindow.style.top = (GhiriGori.bodyOffset + (document.body.clientHeight / 2 - 230)) + "px";
    helpWindow.style.left = "5px";
    helpWindow.style.width = "500px";
    helpWindow.style.margin = "auto";
    helpWindow.style.padding = "auto";
    helpWindow.style.cursor = "default";
    helpWindow.style.color = GhiriGori.fontColor;
    helpWindow.style.backgroundColor = "LightGrey";
    helpWindow.style.fontSize = GhiriGori.fontSize + "px";
    helpWindow.style.textAlign = "left";

    var helpWinBar = document.createElement("div");
    helpWinBar.style.margin = helpWinBar.style.left = helpWinBar.style.top = "0";
    helpWinBar.style.border = "solid 2px DodgerBlue";
    helpWinBar.style.backgroundColor = "White";
    helpWinBar.style.color = "red";
    helpWinBar.style.padding = "3px";
    var helpHideButt = document.createElement("a");
    helpHideButt.appendChild(document.createElement("img"));
    helpHideButt.firstChild.src = "images/hide.png";
    helpHideButt.firstChild.style.border = "none";
    helpHideButt.title = "Hide help window"; 
    helpHideButt.style.padding = helpHideButt.style.margin = helpHideButt.firstChild.style.padding = helpHideButt.firstChild.style.margin = "0";
    helpWinBar.appendChild(helpHideButt);
    helpWinBar.appendChild(document.createElement("span"));
    helpWinBar.lastChild.innerHTML = "Help";
    helpWinBar.lastChild.style.marginLeft = "8px";
    helpWinBar.lastChild.style.verticalAlign = "5px";
    helpWindow.appendChild(helpWinBar);

    var helpPanel = document.createElement("div");
    helpPanel.style.backgroundColor = "White";
    helpPanel.style.margin = "6px";
    helpPanel.style.padding = "5px";
    helpPanel.style.left = helpPanel.style.top = "0";
    helpPanel.innerHTML = GhiriGori.help;
    helpWindow.appendChild(helpPanel);

    document.body.appendChild(helpWindow);

    // Functions called when interface events occur.

    instrLabel.onclick = change_display(instrWindow, "block"); 
    timelLabel.onclick = change_display(timelWindow, "block");
    helpLabel.onclick = change_display(helpWindow, "block");
    helpLabel.onclick();
    instrHideButt.onclick = change_display(instrWindow, "block");
    timelHideButt.onclick = change_display(timelWindow, "block");
    helpHideButt.onclick = change_display(helpWindow, "block");
    addButt.onclick = change_display(addPanel, "block");
    modPanel.firstChild.onclick = change_display(modPanel.lastChild, "block");
//    areaPanel.firstChild.onclick = change_display(areaPanel.lastChild, "block");

    /**
     * Sets dragging of an element.
     * @param {Object} elem Element to be dragged during the mouse pressing.
     * @return {Function} Function called by a mouse click, that sets the element movement during mouse movement.
     */
    var start_drag = function(elem)
    {
        return (function(clickEvent)
        {
            var style = elem.style;
            clickEvent = clickEvent || window.event;
            var offsetX = clickEvent.clientX - parseInt(style.left);
            var offsetY = clickEvent.clientY - parseInt(style.top);
        // TODO: chain with current mousemove
            document.onmousemove = function(moveEvent)
            {
                moveEvent = moveEvent || window.event;
                var tempX = moveEvent.clientX - offsetX, tempY = moveEvent.clientY - offsetY;
                style.left = ((tempX > 0) ? ((tempX < window.innerWidth) ? tempX : window.innerWidth - 30) : 0) + "px";
                style.top = ((tempY > 0) ? ((tempY < window.innerHeight) ? tempY : window.innerHeight - 30) : 0) + "px";
            }
        });
    }
    var stop_drag = function()
    {
        // TODO: chain with current mousemove
        document.onmousemove = null;
    }
    instrWinBar.onmousedown = start_drag(instrWindow);
    timelWinBar.onmousedown = start_drag(timelWindow);
    helpWinBar.onmousedown = start_drag(helpWindow);
    instrWindow.onmousedown = timelWindow.onmousedown = helpWindow.onmousedown = function(clickEvent)
    {
        if (clickEvent.metaKey) start_drag(this)(clickEvent);
    }
        // TODO: chain with current mousemove
    document.onmouseup = stop_drag;

    addPanel.style.display = "none";
    modPanel.lastChild.style.display = "none";

    this.selector = new Selector(this.saveInput);
}

