'use strict'



let gCtx
let gElCanvas

var gShapesDrawn = []
var gMouseDown = false 
var gBackgroundImg = null

let toolSettings = {
    brushSize: 10,
    brushColor: 'black',
    brushShape: 'circle'
}



// utils //

function distanceL2(x1, y1, x2, y2) { return Math.sqrt( (x1 - x2) ** 2 + (y1 - y2) ** 2 ) }

async function uploadImg(imgData, onSuccess) {
    const CLOUD_NAME = 'webify'
    const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    const formData = new FormData()
    formData.append('file', imgData)
    formData.append('upload_preset', 'webify')
    try {
        const res = await fetch(UPLOAD_URL, {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        console.log('Cloudinary response:', data)
        onSuccess(data.secure_url)

    } catch (err) {
        console.log(err)
    }
}

// utils //


// Canvas Service
function drawCanvasFrame() {
    if (!gBackgroundImg) {
        gCtx.fillStyle = 'white'
        gCtx.fillRect(0, 0, gElCanvas.width, gElCanvas.height)
    } else {
        gCtx.drawImage(gBackgroundImg, 0, 0, gElCanvas.width, gElCanvas.height)
    }
}

function loadImageFromInput(ev, onImageReady) {    
    const reader = new FileReader()
    reader.onload = function (event) {
        const img = new Image()
        img.onload = () => { onImageReady(img) }
        img.src = event.target.result
    }        
    reader.readAsDataURL(ev.target.files[0])    
}
function renderImg(img) {
    gBackgroundImg = img    
    gCtx.drawImage(img, 0, 0, gElCanvas.width, gElCanvas.height)
}

// Canvas Service







/// controller ///

function onBrushSizeChange(event)  { toolSettings.brushSize = event.target.value }
function onColorChange(event)      { toolSettings.brushColor = event.target.value }
function onBrushShapeChange(event) { toolSettings.brushShape = event.target.value }
function onClear(event)            { onInit() }

function onEvent(ev) {   
    
    if (ev.type === 'mousedown') {        
        gMouseDown = true
    } else if (ev.type === 'mousemove') {

        if (gMouseDown) {
            gShapesDrawn.push(                
                {
                    
                    _name: 'brushStroke',

                    pos:        { x: ev.offsetX,
                                  y: ev.offsetY
                                },                                
                    size:       toolSettings.brushSize,
                    color:      toolSettings.brushColor,
                    brushShape: toolSettings.brushShape,
            
                    renderSelf() {   

                        if (this['brushShape'] === 'circle') {
                            gCtx.beginPath()
                            gCtx.arc(this['pos']['x'], this['pos']['y'], this['size'], 0, 2 * Math.PI)
                        } else if (this['brushShape'] === 'square') {
                            gCtx.fillRect(this['pos']['x'], this['pos']['y'], this['size'], this['size'])
                        }

                        gCtx.fillStyle = this['color']
                        gCtx.fill()
                    
                    },
                }
            )
        }

    } else if (ev.type === 'mouseup') {
        gMouseDown = false
    }
    
    drawCanvasFrame()

    for(let i = 0; i < gShapesDrawn.length; i++) {
        gShapesDrawn[i].renderSelf()
    }
}


// Download
function onDownload(elLink, event) {
    const dataUrl = gElCanvas.toDataURL()
    elLink.href = dataUrl
    elLink.download = 'my-img'

    renderGallery()
}

// Upload to cloud
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

// Choose Background
function onUploadBackground(ev) { loadImageFromInput(ev, renderImg) }

// Render Gallery
function renderGallery() {
    const data = gElCanvas.toDataURL()
    var elGallery = document.querySelector('.gallery-list')
    elGallery.innerHTML += `<li>
                                <img src="${data}" alt="canvas-image">
                            </li>`
}

/// controller ///





function onInit() {   

    const elContainer = document.querySelector('.canvas-container')
    gElCanvas = document.querySelector('canvas')
    gElCanvas.width = elContainer.offsetWidth
    gElCanvas.height = elContainer.offsetHeight

    gCtx = gElCanvas.getContext('2d')
    
    gShapesDrawn = []
    drawCanvasFrame()
    
}




