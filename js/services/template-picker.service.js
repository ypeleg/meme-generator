'use strict'


const keywordOptions = ['Cat', 'Happy', 'Sad', 'Crazy', 'Sarcastic', 'Funny']

var gImgs

function _debugImages() {
    var debugImages = []
    for (var i = 1; i < 19; i++) {
        debugImages.push({
            id: i,
            url: `img/${i}.jpg`,
            keywords: randomChoice(keywordOptions)
        })
    }
    return debugImages
}

initImgDB()


// Create
function initImgDB() {
    gImgs = _debugImages()
}

// Read
function getImages(byId = null) {
    if (byId === null) return gImgs
    return gImgs.filter(image => (image.id === byId))
}



