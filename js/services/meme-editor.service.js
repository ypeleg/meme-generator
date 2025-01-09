


var gMeme = {

    selectedImgId: 5,
    selectedShapeIdx: 0,

}



// Read
function getMemeImgId() {
    return gMeme.selectedImgId
}

function getSelectedShapeIdx() {
    return gMeme.selectedShapeIdx
}


// Update
function setMemeImgId(imgId) {
    gMeme.selectedImgId = imgId
}

function setSelectedShapeIdx(idx) {
    gMeme.selectedShapeIdx = idx
}


