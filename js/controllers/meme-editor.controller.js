'use strict'



let gCtx
let gElCanvas
var gShapesDrawn = []
var gBackgroundImg = null

var gElToolbar = document.querySelector('.context-toolbar')
var gElCloseToolbar = document.querySelector('.context-toolbar-x')

var gOrigWidth = 0


function renderCanvas() {
    gCtx.drawImage(gBackgroundImg, 0, 0, gElCanvas.width, gElCanvas.height)
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].renderSelf()
        gShapesDrawn[i].renderCallbacks()

    }
}

function loadCanvasWith(imgUrl) {
    const img = new Image()
    img.src = imgUrl
    gBackgroundImg = img
    moveToEditorPage()

    gElCanvas = document.querySelector('canvas')
    gCtx = gElCanvas.getContext('2d')

    const elContainer = document.querySelector('.canvas-container')
    gElCanvas.width = elContainer.offsetWidth
    gOrigWidth = gElCanvas.width
    // gElCanvas.height = gElCanvas.width
    gElCanvas.height = gBackgroundImg.height * gElCanvas.width / gBackgroundImg.width

    var maxHeight = document.querySelector('.main-layout').offsetHeight / 2
    console.log('maxHeight:', maxHeight)
    if (gElCanvas.height > maxHeight) {
        gElCanvas.height = maxHeight
        gElCanvas.width = gBackgroundImg.width * gElCanvas.height / gBackgroundImg.height
    }
    resetCanvas()
}

function resetCanvas() {

    gShapesDrawn = []

    var textX = gElCanvas.width
    var textY = gElCanvas.height

    textShape('Top Text',
        textX / 2,
        70,
        100 * Math.max(gElCanvas.height, gElCanvas.width) / gOrigWidth)

    textShape('Bottom Text',
        textX / 2,
        textY - 70,
        100 * Math.max(gElCanvas.height, gElCanvas.width) / gOrigWidth)

    onInitEditableTexts()
    updateTextInputs()
    hideAllToolbars()
    renderCanvas()
}

function resizeCanvas(){

    var oldCanvasX = gElCanvas.width
    var oldCanvasY = gElCanvas.height

    const elContainer = document.querySelector('.canvas-container')
    gElCanvas.width = elContainer.offsetWidth
    gElCanvas.height = gBackgroundImg.height * gElCanvas.width / gBackgroundImg.width
    // gElCanvas.height = gElCanvas.width

    var maxHeight = document.querySelector('.main-layout').offsetHeight / 2
    console.log('maxHeight:', maxHeight)
    if (gElCanvas.height > maxHeight) {
        gElCanvas.height = maxHeight
        gElCanvas.width = gBackgroundImg.width * gElCanvas.height / gBackgroundImg.height
    }

    for (let i = 0; i < gShapesDrawn.length; i++) {
        var currentShapeX = gShapesDrawn[i].x
        var currentShapeY = gShapesDrawn[i].y
        var currentShapeSize = gShapesDrawn[i].size

        var newShapeX = currentShapeX / oldCanvasX * elContainer.offsetWidth
        var newShapeY = currentShapeY / oldCanvasY * elContainer.offsetHeight
        var newShapeSize = currentShapeSize / oldCanvasY * elContainer.offsetHeight

        gShapesDrawn[i].x = newShapeX
        gShapesDrawn[i].y = newShapeY
        gShapesDrawn[i].size = newShapeSize
    }

    renderCanvas()
}






















function onEvent(ev) {
    if (ev.type === 'mousemove') { gElCanvas.style.cursor = 'default' }
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].trigger(ev)
    }
    renderCanvas()
}

function onSelectedTemplate(event, element){
    var selectedImg = getImages(parseInt(element.id.split('-')[1]))[0]
    loadCanvasWith(selectedImg.url)
}

function onUploadBackground(ev) {
    const reader = new FileReader()
    reader.onload = (event) => { loadCanvasWith(event.target.result) }
    reader.readAsDataURL(ev.target.files[0])
}


function fixTouchCoords(ev) {
    const TOUCH_EVS = ['touchstart', 'touchmove', 'touchend']
    let pos = {
        x: ev.offsetX,
        y: ev.offsetY,
    }
    if (TOUCH_EVS.includes(ev.type)) {
        ev.preventDefault()
        ev = ev.changedTouches[0]
        pos = {
            x: ev.pageX - ev.target.offsetLeft - ev.target.clientLeft,
            y: ev.pageY - ev.target.offsetTop - ev.target.clientTop,
        }
    }
    return [pos.x, pos.y]
}

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
        color: color || 'white',

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
        offsetX: 0,
        offsetY: 0,

        onMouseUp(ev) {
            this.isDrag = false
        },

        onMouseDown(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if (this.isClickedOn(offsetX, offsetY)) {
                this.isDrag = true
                this.offsetX = this.x - offsetX
                this.offsetY = this.y - offsetY
            }
        },

        onMouseMove(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if (this.isDrag) {
                // gElCanvas.style.cursor = 'grabbing'
                gElCanvas.style.cursor = 'move'
                this.moveTo(offsetX + this.offsetX, offsetY + this.offsetY)

            } else {
                if (this.isClickedOn(offsetX, offsetY)) {
                    gElCanvas.style.cursor = 'move'
                }
            }
        },
    })

    draggable.registerCallback(draggable, draggable.onMouseUp, 'mouseup')
    draggable.registerCallback(draggable, draggable.onMouseDown, 'mousedown')
    draggable.registerCallback(draggable, draggable.onMouseMove, 'mousemove')

    draggable.registerCallback(draggable, draggable.onMouseUp, 'ontouchstart')
    draggable.registerCallback(draggable, draggable.onMouseDown, 'ontouchend')
    draggable.registerCallback(draggable, draggable.onMouseMove, 'ontouchmove')

    return draggable
}

function stopPropagation(ev) {
    ev.stopPropagation()
}

function onTextChange(ev) {

    var text = ev.target.value
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].text = text

    document.querySelector('.editable-text-' + (currentSelectedShapeIdx + 1)).value = text

    document.querySelector('.context-toolbar-text-editor-input').value = text


    renderCanvas()
}

var gToolbarUp = true

function shapeWithToolbar() {

    var shape = extend(abstractShape(), {

        isDragged: false,
        isSelected: false,
        isOver: false,

        showToolbar() {

            gElToolbar.style.display = 'block'
            setSelectedShapeIdx(this.id)
            this.isSelected = true
        },

        hideToolbar() {
            gElToolbar.style.display = 'none'
            this.isSelected = false

            document.querySelector('.editable-text-' + (this.id + 1)).classList.remove('in-focus')

        },

        toolbarOnMouseDown(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if ((!this.isDragged) && (this.isClickedOn(offsetX, offsetY))) {
                this.isDragged = true
                // this.hideToolbar()
                this.moveToolBarToSelf()
            } else if (!this.isClickedOn(offsetX, offsetY)) {
                this.hideToolbar()
            }
        },

        toolbarOnMouseMove(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if (this.isDragged) {
                // this.hideToolbar()
                this.moveToolBarToSelf()
                document.querySelector('.editable-text-' + (this.id + 1)).classList.add('in-focus')
            } else if (this.isClickedOn(offsetX, offsetY)) {
                this.isOver = true
            } else {
                this.isOver = false
            }

        },

        moveToolBar(x, y) {


            var canvasX = gElCanvas.getBoundingClientRect().left
            var canvasY = gElCanvas.getBoundingClientRect().top

            var elWorkArea = document.querySelector('.work-area')
            var workAreaWidth = elWorkArea.offsetWidth


            var finalX = x + canvasX
            var finalY = y + canvasY


            if (finalX > workAreaWidth - gElToolbar.offsetWidth) { finalX = workAreaWidth - gElToolbar.offsetWidth }

            if (finalY < canvasY) {
                finalY += (this.size * 2) + (gElToolbar.getBoundingClientRect().height) + 20
            }

            if (finalY < 60) { finalY = 60 }
            if (finalX < 0) { finalX = 0 }
            

            gElToolbar.style.left = finalX + 'px'
            gElToolbar.style.top = finalY + 'px'
            gElToolbar.style.bottom = 'auto'

            // console.log('toolbar moved to', x, y)


        },

        moveToolBarToSelf() {
            var padding = 10
            this.showToolbar()

            var screenWidth = window.innerWidth

            if (screenWidth < 800) {
                gElToolbar.style.left = '0'
                gElToolbar.style.top = 'auto'
                gElToolbar.style.bottom = '0'

            } else {

                var toolbarHeight = gElToolbar.getBoundingClientRect().height
                document.querySelector('.context-toolbar-text-editor-input').value = this.text
                document.querySelector('.editable-text-' + (this.id + 1)).classList.add('in-focus')


                var leftCorner = this.x - (this.getWidth() / 2)

                var toolBarRelCenter = gElToolbar.offsetWidth / 2
                var textRelCenter = this.getWidth() / 2

                var finxlX = leftCorner + textRelCenter - toolBarRelCenter

                this.moveToolBar(finxlX,
                    this.y - (this.size) - (toolbarHeight) - padding)
            }
        },

        toolbarOnMouseUp(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if ((this.isDragged) && (this.isClickedOn(offsetX, offsetY))) {
                this.moveToolBarToSelf()
                this.isDragged = false
            }
        },

        toolbarrenderSelf() {

            if ((this.isSelected) || this.isDragged || this.isOver) {

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
    shape.registerCallback(shape, shape.toolbarOnMouseMove, 'mousemove')
    shape.registerCallback(shape, shape.toolbarOnMouseUp, 'mouseup')

    shape.registerCallback(shape, shape.toolbarOnMouseDown, 'ontouchstart')
    shape.registerCallback(shape, shape.toolbarOnMouseMove, 'ontouchmove')
    shape.registerCallback(shape, shape.toolbarOnMouseUp, 'ontouchend')

    shape.registerCallback(shape, shape.toolbarrenderSelf, 'onrender')

    return shape

}

function shapeWithToolbarClose() {

    var shape = extend(abstractShape(), {

        isDragged: false,
        isSelected: false,
        isOver: false,

        ToolbarCloseOnMouseDown(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if ((!this.isDragged) && (this.isClickedOn(offsetX, offsetY))) {
                this.isDragged = true
                this.isSelected = true
                this.moveCloseToolBarToSelf()
                setSelectedShapeIdx(this.id)
            } else if (!this.isClickedOn(offsetX, offsetY)) {
                this.isSelected = false
                this.hideCloseToolbar()
            }
        },

        ToolbarCloseOnMouseMove(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if (this.isDragged) {
                setSelectedShapeIdx(this.id)
                this.isSelected = true
                this.moveCloseToolBarToSelf()
            } else if (this.isClickedOn(offsetX, offsetY)) {
                this.isOver = true
                this.moveCloseToolBarToSelf()
            } else {
                this.isOver = false
            }
        },

        showCloseToolbar() {

            gElCloseToolbar.style.display = 'block'
            setSelectedShapeIdx(this.id)
            this.isSelected = true
        },

        hideCloseToolbar() {
            gElCloseToolbar.style.display = 'none'
            this.isSelected = false
        },

        moveCloseToolBarToSelf() {
            var padding = 10
            this.showCloseToolbar()

            var screenWidth = window.innerWidth
            var toolbarHeight = gElCloseToolbar.getBoundingClientRect().height

            if (screenWidth < 800) {
                gElCloseToolbar.style.left = '0'
                gElCloseToolbar.style.top = 'auto'
                gElCloseToolbar.style.bottom = '0'
            } else {

                var leftCorner = this.x - (this.getWidth() / 2)

                var toolBarRelCenter = gElCloseToolbar.offsetWidth / 2
                var textRelCenter = this.getWidth() / 2

                var finxlX = leftCorner + textRelCenter - toolBarRelCenter

                this.moveCloseToolBar(
                    finxlX, //this.x - (this.getWidth() / 2) - padding,
                    this.y - this.size - toolbarHeight - padding
                )
            }
        },

        moveCloseToolBar(x, y) {
            var canvasX = gElCanvas.getBoundingClientRect().left
            var canvasY = gElCanvas.getBoundingClientRect().top
            var elWorkArea = document.querySelector('.work-area')
            var workAreaWidth = elWorkArea.offsetWidth

            var finalX = x + canvasX
            var finalY = y + canvasY

            if (finalY < 60) finalY = 60
            if (finalX < 0) finalX = 0
            if (finalX > workAreaWidth - gElCloseToolbar.offsetWidth) {
                finalX = workAreaWidth - gElCloseToolbar.offsetWidth
            }
            if (finalY < canvasY) {
                finalY += (this.size * 2) + gElCloseToolbar.getBoundingClientRect().height + 20
            }

            gElCloseToolbar.style.left = finalX + 'px'
            gElCloseToolbar.style.top = finalY + 'px'
            gElCloseToolbar.style.bottom = 'auto'
        },
        ToolbarCloseOnMouseUp(ev) {
            var [offsetX, offsetY] = fixTouchCoords(ev)
            if ((this.isDragged) && (this.isClickedOn(offsetX, offsetY))) {
                this.isDragged = false
                this.moveCloseToolBarToSelf()
            }
        },


        ToolbarCloserenderSelf() {

            if ((this.isSelected) || this.isDragged || this.isOver) {

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

    shape.registerCallback(shape, shape.ToolbarCloseOnMouseDown, 'mousedown')
    shape.registerCallback(shape, shape.ToolbarCloseOnMouseMove, 'mousemove')
    shape.registerCallback(shape, shape.ToolbarCloseOnMouseUp, 'mouseup')

    shape.registerCallback(shape, shape.ToolbarCloseOnMouseDown, 'ontouchstart')
    shape.registerCallback(shape, shape.ToolbarCloseOnMouseMove, 'ontouchmove')
    shape.registerCallback(shape, shape.ToolbarCloseOnMouseUp, 'ontouchend')

    shape.registerCallback(shape, shape.ToolbarCloserenderSelf, 'onrender')

    return shape

}

function onAddText(ev) {
    ev.stopPropagation()
    ev.preventDefault()
    textShape()
    onInitEditableTexts()
    updateTextInputs()
    hideAllToolbars()
    renderCanvas()
}

function onRemoveText(el, event) {
    event.stopPropagation()

    var currentIdx = el.parentElement.getAttribute('data-text-idx')
    gShapesDrawn.splice(parseInt(currentIdx) - 1, 1)
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].id = i
    }
    onInitEditableTexts()
    updateTextInputs()
    hideAllToolbars()
    renderCanvas()
}

function onClickedEditableText(el, event) {
    var currentIdx = el.getAttribute('data-text-idx')
    setSelectedShapeIdx(parseInt(currentIdx) - 1)

    var currentSelectedShapeIdx = getSelectedShapeIdx()
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].hideToolbar()
    }
    if (! (gShapesDrawn[currentSelectedShapeIdx] === undefined) ) {
        gShapesDrawn[currentSelectedShapeIdx].moveToolBarToSelf()
    }
    renderCanvas()
}

function hideAllToolbars() {
    for (let i = 0; i < gShapesDrawn.length; i++) {
        if (gShapesDrawn[i].hideToolbar !== undefined) {
            gShapesDrawn[i].hideToolbar()
        }

        if (gShapesDrawn[i].hideCloseToolbar !== undefined) {
            gShapesDrawn[i].hideCloseToolbar()
        }
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

function onStrokeWidthChange(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].strokeWidth = event.target.value
    renderCanvas()
}

function onStrokeColorChange(event) {
    var currentSelectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn[currentSelectedShapeIdx].strokeColor = event.target.value
    renderCanvas()
}

function hiddenByOther(id, x, y) {
    for (let i = id + 1; i < gShapesDrawn.length; i++) {
        if (gShapesDrawn[i].isClickedInHitBox(x, y)) {
            return true
        }
    }
    return false
}

function textShape(text = null, x = null, y = null, size = null, color = null) {
    var text = {

        font: 'Impact',
        textAlign: 'center',
        fontStyle: 'normal',
        fontWeight: 'normal',
        text: text || 'Sample Text',
        strokeColor: 'black',
        strokeWidth: 2,

        isClickedInHitBox(clickX, clickY) {
            return (clickX >= this.x - gCtx.measureText(this.text).width / 2 &&
                clickX <= this.x + gCtx.measureText(this.text).width / 2 &&
                clickY >= this.y - this.size / 2 &&
                clickY <= this.y + this.size / 2)
        },

        isClickedOn(clickX, clickY) {
            gCtx.font = `${this.size}px ${this.font}`
            var hitBox = this.isClickedInHitBox(clickX, clickY)
            if (hitBox) {
                if (!hiddenByOther(this.id, clickX, clickY)) {
                    return true
                }
            }
            return false
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

            if (this.strokeWidth > 0) {
                gCtx.setLineDash([])
                gCtx.strokeStyle = this.strokeColor
                gCtx.lineWidth = this.strokeWidth
                gCtx.strokeText(this.text, this.x, this.y)
            }

        }
    }

    text = extend(text, draggableShape())

    text = extend(text, shapeWithToolbar())

    text = extend(text, abstractShape(gShapesDrawn.length, x, y, size, color))

    gShapesDrawn.push(text)
}

function imageShape(url = null, x = null, y = null, width = 100, height = 100) {
    var image = {
        img: new Image(),

        isClickedInHitBox(clickX, clickY) {
            return (
                clickX >= this.x - this.width / 2 &&
                clickX <= this.x + this.width / 2 &&
                clickY >= this.y - this.height / 2 &&
                clickY <= this.y + this.height / 2
            )
        },

        getWidth() {
            return this.width
        },

        isClickedOn(clickX, clickY) {
            if (this.isClickedInHitBox(clickX, clickY)) {
                if (!hiddenByOther(this.id, clickX, clickY)) return true
            }
            return false
        },

        renderSelf() {
            if (!this.img.complete) return
            gCtx.drawImage(
                this.img,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            )
        }
    }

    image.img.src = url

    var imgWidth = image.img.width
    var imgHeight = image.img.height

    if (imgWidth > imgHeight) {
        height = 50
        width = 50 * imgWidth / imgHeight
    } else {
        width = 50
        height = 50 * imgHeight / imgWidth
    }

    image.x = x
    image.y = y
    image.width = width
    image.height = height

    image = extend(image, draggableShape())
    image = extend(image, shapeWithToolbarClose())
    image = extend(image, abstractShape(gShapesDrawn.length, x, y, width, null))

    gShapesDrawn.push(image)
}

function onShareOnFacebook(elLink, event) {
    return onUpload(elLink, event)
}

function onSaveMeme(elLink, event) {
    const data = gElCanvas.toDataURL()
    saveMeme(data)
}

function onDownload(elLink, event) {
    const dataUrl = gElCanvas.toDataURL()
    elLink.href = dataUrl
    elLink.download = 'my-img'

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
}

function updateTextInputs() {
    for (let i = 0; i < gShapesDrawn.length; i++) {
        var elTextInput = document.querySelector('.editable-text-' + (i + 1))
        if (!(gShapesDrawn[i].text === undefined)) {
            elTextInput.value = gShapesDrawn[i].text
            elTextInput.innerText = gShapesDrawn[i].text

            var elContextToolbarTextEditorInput = document.querySelector('.context-toolbar-text-editor-input')
            elContextToolbarTextEditorInput.value = gShapesDrawn[i].text
        }
    }
}

function onInitEditableTexts() {
    var elEditableText = document.querySelector('.editable-texts')
    var innerHTML = ''
    for (let i = 0; i < gShapesDrawn.length; i++) {
        if ( !(gShapesDrawn[i].text === undefined) ) {
            innerHTML += `
            <div class="editable-text" data-text-idx="${i + 1}" onclick="onClickedEditableText(this, event)" onfocusout="hideAllToolbars()">
                <input class="editable-text-${i + 1}" type="text" placeholder="" oninput="onTextChange(event)"/>
                <i class="fa-solid fa-trash delete-icon" onclick="onRemoveText(this, event)"></i>
            </div>`
        }
    }
    elEditableText.innerHTML = innerHTML
}
function renderStickers() {
    var elStickerModal = document.querySelector('.sticker-modal-grid')
    var strHTML = ''
    for (let i = 1; i < 37; i++) {
        strHTML += `<div class="sticker-modal-grid-item" onclick="onAddSticker(this, event)" data-sticker="img/stickers/${i}.png">
                        <img src="img/stickers/${i}.png" />
                    </div>
                    `
    }
    elStickerModal.innerHTML = strHTML
}

function onOpenStickerModal(event) {
    renderStickers()
    var elStickerModal = document.querySelector('.sticker-modal')
    elStickerModal.style.display = 'flex'
}

function onCloseStickerModal(event) {
    var elStickerModal = document.querySelector('.sticker-modal')
    elStickerModal.style.display = 'none'
}

function onAddSticker(el, event) {
    var stickerUrl = el.getAttribute('data-sticker')
    // console.log('stickerUrl:', stickerUrl)
    imageShape(stickerUrl)
    onInitEditableTexts()
    updateTextInputs()
    hideAllToolbars()
    renderCanvas()
    onCloseStickerModal()
}

function onRemoveSticker(el, event) {
    var selectedShapeIdx = getSelectedShapeIdx()
    gShapesDrawn.splice(selectedShapeIdx, 1)
    for (let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].id = i
    }
    onInitEditableTexts()
    updateTextInputs()
    hideAllToolbars()
    renderCanvas()
    gElCloseToolbar.style.display = 'none'
}










