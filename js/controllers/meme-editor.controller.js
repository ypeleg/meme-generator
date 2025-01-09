'use strict'


// TODO: Things I dont understand well:
// "this"..
// any better way to do OOP


// TODO: Known Bugs:
// When clicking on the back button, remove the menu
// Add another upper button for "saved memes and for editor"
// The clear button doesnt add the texts again
// drag is from the "middle"
//


let gCtx
let gElCanvas
var gShapesDrawn = []
var gMouseDown = false
var gBackgroundImg = null

var gElToolbar = document.querySelector('.context-toolbar')


// Canvas "utils"
function drawCanvasFrame() {
    if (!gBackgroundImg) {
        gCtx.fillStyle = 'white'
        gCtx.fillRect(0, 0, gElCanvas.width, gElCanvas.height)
    } else {
        gCtx.drawImage(gBackgroundImg, 0, 0, gElCanvas.width, gElCanvas.height)
    }
}

function renderImg(img) {
    gBackgroundImg = img
    gCtx.drawImage(img, 0, 0, gElCanvas.width, gElCanvas.height)
}

// Canvas "utils"


// TODO: move to  'Generic Shapes'
function extend(obj1, obj2) {
    for (let key in obj2) {
        if (!(key === 'callbackFuncs')) {
            obj1[key] = obj2[key]
        } else {
            if (obj1[key] === undefined) {
                obj1[key] = {}
            }
            for (let key2 in obj2[key]) {
                if (obj1[key][key2] === undefined) {
                    obj1[key][key2] = []
                }
                if (typeof obj2[key][key2] === 'function') {
                    obj1[key][key2].push(obj2[key][key2])
                } else {
                    for (let i = 0; i < obj2[key][key2].length; i++) {
                        obj1[key][key2].push(obj2[key][key2][i])
                    }
                }
            }
        }
    }
    return obj1
}

function abstractShape(id = null, x = null, y = null, size = null, color = null) {
    var instance = {

        id: id || gShapesDrawn.length,

        x: x || gElCanvas.width / 2,
        y: y || gElCanvas.height / 2,

        size: size || 60,
        color: color || 'blue',

        moveTo(x, y) {
            this['x'] = x
            this['y'] = y
        },

        callbackFuncs: {},

        registerCallback(self, funcPtr, eventType) {

            if (self.callbackFuncs[eventType] === undefined) {
                self.callbackFuncs[eventType] = [funcPtr]
            } else {
                self.callbackFuncs[eventType].push(funcPtr)
            }
        },

        trigger(ev) {
            if (this.callbackFuncs[ev.type] !== undefined) {
                for (let i = 0; i < this.callbackFuncs[ev.type].length; i++) {

                    this.callbackFuncs[ev.type][i].call(this, ev)

                }
            }

            this.renderSelf()

        },

        renderCallbacks() {
            if (this.callbackFuncs['onrender'] !== undefined) {
                for (let i = 0; i < this.callbackFuncs['onrender'].length; i++) {
                    this.callbackFuncs['onrender'][i].call(this)
                }
            }
        }

    }
    return instance
}


function draggableShape() {

    var draggable = extend(abstractShape(), {

        isDrag: false,

        onMouseUp(ev) {
            this.isDrag = false
        },

        onMouseDown(ev) {
            if (this.isClickedOn(ev.offsetX, ev.offsetY)) {
                this.isDrag = true
            }
        },

        onMouseMove(ev) {
            if (this.isDrag) {
                this.moveTo(ev.offsetX, ev.offsetY)
            }
        },
    })

    draggable.registerCallback(draggable, draggable.onMouseUp, 'mouseup');
    draggable.registerCallback(draggable, draggable.onMouseDown, 'mousedown');
    draggable.registerCallback(draggable, draggable.onMouseMove, 'mousemove');

    return draggable
}

function onTextChange(ev) {
    var text = ev.target.value
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].text = text

    document.querySelector('.editable-text-' + (currentSelectedShapeIdx + 1)).value = text

    renderCanvas()
}

function shapeWithToolbar() {

    var shape = extend(abstractShape(), {

        isDragged: false,
        isSelected: false,

        showToolbar() {

            gElToolbar.style.display = 'block'
            setSelectedShapeIdx(this.id)
            this.isSelected = true
        },

        hideToolbar() {
            gElToolbar.style.display = 'none'
            this.isSelected = false
        },

        toolbarOnMouseDown(ev) {
            if ((!this.isDragged) && (this.isClickedOn(ev.offsetX, ev.offsetY))) {
                this.isDragged = true
                this.hideToolbar()
            } else if (!this.isClickedOn(ev.offsetX, ev.offsetY)) {
                this.hideToolbar()
            }
        },

        toolbarOnMouseMove(ev) {
            if (this.isDragged) {
                this.hideToolbar()
            }
        },

        moveToolBar(x, y) {
            var canvasX = gElCanvas.getBoundingClientRect().left
            var canvasY = gElCanvas.getBoundingClientRect().top

            gElToolbar.style.left = x + canvasX + 'px'
            gElToolbar.style.top = y + canvasY + 'px'

            // TODO: Center the toolbar..
            // gElToolbar.style.width = this.getWidth() + 20 + 'px'

            console.log('toolbar moved to', x, y)


        },

        moveToolBarToSelf() {
            var padding = 10
            this.showToolbar()
            var toolbarHeight = gElToolbar.getBoundingClientRect().height

            document.querySelector('.context-toolbar-text-editor-input').value = this.text

            this.moveToolBar(this.x - (this.getWidth() / 2) - padding,
                this.y - (this.size) - (toolbarHeight) - padding)
        },

        toolbarOnMouseUp(ev) {
            if ((this.isDragged) && (this.isClickedOn(ev.offsetX, ev.offsetY))) {
                this.moveToolBarToSelf()
                this.isDragged = false
            }
        },

        toolbarrenderSelf() {

            if ((this.isSelected) || this.isDragged) {

                var padding = 10

                function drawLine(x1, y1, x2, y2, color, offset = 0, dash = [0, 0, 5, 5]) {
                    gCtx.beginPath()
                    gCtx.setLineDash(dash)
                    gCtx.rect(x1 - offset, y1 - offset, x2 + offset, y2 + offset)
                    gCtx.strokeStyle = color
                    gCtx.lineWidth = 2
                    gCtx.stroke()
                }

                var x1 = this.x - (this.getWidth() / 2) - padding
                var y1 = this.y - (this.size / 2) - padding
                var x2 = this.getWidth() + 2 * padding
                var y2 = this.size + 2 * padding

                drawLine(x1, y1, x2, y2, '#262626', 1, [0, 5, 1])
                drawLine(x1, y1, x2, y2, '#d8d8cf', 1, [5, 1, 0])
            }

        },
    })

    shape.registerCallback(shape, shape.toolbarOnMouseDown, 'mousedown')
    shape.registerCallback(shape, shape.toolbarOnMouseMove, 'mousedown')
    shape.registerCallback(shape, shape.toolbarOnMouseUp, 'mouseup')
    shape.registerCallback(shape, shape.toolbarrenderSelf, 'onrender')

    return shape

}






function onClickedEditableText(el, event) {
    var currentIdx = el.getAttribute('data-text-idx')
    setSelectedShapeIdx(parseInt(currentIdx) - 1)

    var currentSelectedShapeIdx = getSelectedShapeIdx()
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].hideToolbar()
    }

    gShapesDrawn[currentSelectedShapeIdx].moveToolBarToSelf()

    renderCanvas()
}

function hideAllToolbars() {
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].hideToolbar()
    }
    renderCanvas()
}

function onFontChange(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].font = event.target.value
    renderCanvas()
}

function onColorChange(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].color = event.target.value
    renderCanvas()
}

function onFontSizeChange(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    var change = event.target.innerText === 'A+' ? 10 : -10
    gShapesDrawn[currentSelectedShapeIdx].size += change
    renderCanvas()
}

function onBold(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].fontWeight = gShapesDrawn[currentSelectedShapeIdx].fontWeight === 'bold' ? 'normal' : 'bold'
    renderCanvas()
}

function onItalic(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].fontStyle = gShapesDrawn[currentSelectedShapeIdx].fontStyle === 'italic' ? 'normal' : 'italic'
    renderCanvas()
}

function onLtr(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].textAlign = 'left'
    renderCanvas()
}

function onRtl(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].textAlign = 'right'
    renderCanvas()
}

function onCenter(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].textAlign = 'center'
    renderCanvas()
}





function textShape(text = null, x = null, y = null, size = null, color = null) {
    var text = {

        font: 'Impact',
        textAlign: 'center',
        fontStyle: 'normal',
        fontWeight: 'normal',
        text: text || 'Sample Text',


        isClickedOn(clickX, clickY) {
            gCtx.font = `${this.size}px ${this.font}`
            return (clickX >= this.x - gCtx.measureText(this.text).width / 2 &&
                clickX <= this.x + gCtx.measureText(this.text).width / 2 &&
                clickY >= this.y - this.size / 2 &&
                clickY <= this.y + this.size / 2)
        },

        getWidth() {
            return gCtx.measureText(this.text).width
        },

        renderSelf() {

            var fontStr = `${this.fontStyle} normal ${this.fontWeight} ${this.size}px ${this.font}`

            gCtx.font = fontStr
            gCtx.fillStyle = this.color
            gCtx.textAlign = this.textAlign
            gCtx.textBaseline = 'middle'

            gCtx.fillText(this.text, this.x, this.y)

        }
    }


    text = extend(text, draggableShape())

    text = extend(text, shapeWithToolbar())

    text = extend(text, abstractShape(gShapesDrawn.length, x, y, size, color))


    gShapesDrawn.push(text)
}

// TODO: move to  'Generic Shapes'


function onShareOnFacebook(elLink, event) {
    return onUpload(elLink, event)
}

function onDownload(elLink, event) {
    const dataUrl = gElCanvas.toDataURL()
    elLink.href = dataUrl
    elLink.download = 'my-img'

}

function onClear(event) {
    onInitMemeEditor()
}

function renderCanvas() {
    drawCanvasFrame()
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].renderSelf()
        gShapesDrawn[i].renderCallbacks()

    }
}

function onEvent(ev) {
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].trigger(ev)
    }
    if (ev.type === 'mousedown') {
        gMouseDown = true
    } else if (ev.type === 'mouseup') {
        gMouseDown = false
    }
    renderCanvas()
}


//upload to social media
function onUpload(el, event) {
    event.preventDefault()
    const canvasData = gElCanvas.toDataURL('image/jpeg')

    function onSuccess(uploadedImgUrl) {
        const encodedUploadedImgUrl = encodeURIComponent(uploadedImgUrl)
        console.log('encodedUploadedImgUrl:', encodedUploadedImgUrl)
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUploadedImgUrl}&t=${encodedUploadedImgUrl}`)
    }

    uploadImg(canvasData, onSuccess)
    renderGallery()
}

function updateTextInputs() {
    for (let i = 0; i < gShapesDrawn.length; i++) {
        var elTextInput = document.querySelector('.editable-text-' + (i + 1))
        elTextInput.value = gShapesDrawn[i].text
        elTextInput.innerText = gShapesDrawn[i].text
    }
}

function resetCanvas(){
    // TODO: Chose dynamiclly the color and size depending on the selected image..
    textShape('Top Text',
        gElCanvas.width / 2,
        70,
        100,
        'white')

    textShape('Bottom Text',
        gElCanvas.width / 2,
        gElCanvas.height - 70,
        100,
        'white')

    updateTextInputs()
    hideAllToolbars()    
    renderCanvas()

}

function onInitMemeEditor() {

    const elContainer = document.querySelector('.canvas-container')
    gElCanvas = document.querySelector('canvas')
    gElCanvas.width = elContainer.offsetWidth
    gElCanvas.height = elContainer.offsetHeight

    gCtx = gElCanvas.getContext('2d')

    gShapesDrawn = []

    resetCanvas()
}




