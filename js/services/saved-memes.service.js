'use strict'


const DB_KEY = 'savedMemes'


var gSavedMemes = loadFromStorage(DB_KEY) || []


function saveMeme(imgData) {
    console.log('imgData:', imgData)
    gSavedMemes.push(imgData)
    saveToStorage(DB_KEY, gSavedMemes)
}

function getSavedMemes() {
    return gSavedMemes
}

