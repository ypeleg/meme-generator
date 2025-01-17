'use strict'


var gEditedMemeAlready = false


function shuffleArray(array) {
    var indices = []
    for (var i = 0; i < array.length; i++) {
        indices.push(i)
    }
    var newArray = []
    while (indices.length > 0) {
        var randomIndex = Math.floor(Math.random() * indices.length)
        newArray.push(array[indices[randomIndex]])
        indices.splice(randomIndex, 1)
    }
    return newArray
}

function clickOnUpload() { document.querySelector('.imgupload').click() }

function onInitGallery() {
    var elGalleryImages = document.querySelector('.gallery-grid-container')
    var images = getImages()
    images = shuffleArray(images)

    // var strHTML = `<img class = "first-img" src="img/upload.png" onclick="clickOnUpload()">`

    var strHTML = `
    <div class = "first-img" onclick="clickOnUpload()">
        <div class="fa fa-upload"></div>
        <p>Upload Image</p>
    </div>`

    for( var i = 0; i < images.length; i++){ strHTML += `<img id="img-${images[i].id}" src="${images[i].url}" onclick="onSelectedTemplate(event, this)">` }
    elGalleryImages.innerHTML = strHTML
    onRenderFilters()
}







function moveToEditorPage(){

    closeTopMenuIfOpen()
    
    document.querySelector('.page-gallery').style.display = 'none'
    document.querySelector('.page-editor').style.display = 'contents'
    document.querySelector('.page-saved-gallery').style.display = 'none'

    document.querySelector('.side-page-gallery').style.display = 'none'
    document.querySelector('.side-page-editor').style.display = 'flex'
    document.querySelector('.side-page-saved').style.display = 'none'

    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.editor-nav').classList.add('top-bar-active')

    gEditedMemeAlready = true

    

}

function moveToGalleryPage(event, element){

    closeTopMenuIfOpen()

    document.querySelector('.page-gallery').style.display = 'flex'
    document.querySelector('.page-editor').style.display = 'none'
    document.querySelector('.page-saved-gallery').style.display = 'none'

    document.querySelector('.side-page-gallery').style.display = 'flex'
    document.querySelector('.side-page-editor').style.display = 'none'
    document.querySelector('.side-page-saved').style.display = 'none'

    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.gallery-nav').classList.add('top-bar-active')

    hideAllToolbars()
    onInitGallery()
    
    


}

function moveToSavedMemesPage(event, element){

    closeTopMenuIfOpen()

    document.querySelector('.page-gallery').style.display = 'none'
    document.querySelector('.page-editor').style.display = 'none'
    document.querySelector('.page-saved-gallery').style.display = 'flex'

    document.querySelector('.side-page-gallery').style.display = 'none'
    document.querySelector('.side-page-editor').style.display = 'none'
    document.querySelector('.side-page-saved').style.display = 'flex'



    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.saved-memes-nav').classList.add('top-bar-active')

    hideAllToolbars()
    onInitSavedMemes()

    


}


function moveToEditorIfYouCan() {
    if (gEditedMemeAlready) moveToEditorPage()
    else moveToGalleryPage()
}

function removeDuplicates(arr){
    return arr.filter(function(item, pos) {
        return (arr.indexOf(item) == pos)
    })
}

function tagsClickCount(tag){
    return gKeywordSearchCountMap[tag]
}

function onRenderFilters() {
    var elFilters = document.querySelector('.tags')

    var images = getImages()
    var tags = []
    for( var i = 0; i < images.length; i++){
        tags = tags.concat(images[i].keywords)
    }

    tags = removeDuplicates(tags)

    var strHTML = ''

    var tagPopularityMap = {}
    for( var i = 0; i < tags.length; i++){
        tagPopularityMap[tags[i]] = tagsClickCount(tags[i].toLowerCase())
    }

    for( var i = 0; i < tags.length; i++){
        var popularityStr = ''
        if (tagPopularityMap[tags[i]] === undefined) popularityStr = '04'
        else if ((tagPopularityMap[tags[i]] + 4) > 9) popularityStr = '10'
        else popularityStr = '0' + (tagPopularityMap[tags[i]] + 4)
        strHTML += `<button class="tag-btn font-size-${popularityStr}em" onclick="onFilterByTag(this, event)">${tags[i]}</button>`
    }

    elFilters.innerHTML = strHTML
}

function addClickToTag(tag){
    if (gKeywordSearchCountMap[tag] === undefined){
        gKeywordSearchCountMap[tag] = 1
    } else {
        gKeywordSearchCountMap[tag]++
    }
}

function onSearch(event) {
    var searchStr = event.target.value


    searchStr = searchStr.split('#').join('')


    var images = getImages()
    var filteredImages = images.filter(function(image){
        return image.keywords.toLowerCase().includes( searchStr.toLowerCase() )
    })

    var strHTML = ''

    for( var i = 0; i < filteredImages.length; i++){
        strHTML += `<img id="img-${filteredImages[i].id}" src="${filteredImages[i].url}" onclick="onSelectedTemplate(event, this)">`
    }

    var elGalleryImages = document.querySelector('.gallery-grid-container')
    elGalleryImages.innerHTML = strHTML
}






function onFilterByTag(element, event) {
    var tag = element.innerText
    addClickToTag(element.innerText.toLowerCase())
    onRenderFilters()

    var images = getImages()
    console.log('tag:', tag)
    var filteredImages = images.filter(function(image){

        return image.keywords.toLowerCase().includes( tag.toLowerCase() )
    })

    var strHTML = ''

    for( var i = 0; i < filteredImages.length; i++){
        strHTML += `<img id="img-${filteredImages[i].id}" src="${filteredImages[i].url}" onclick="onSelectedTemplate(event, this)">`
    }

    var elGalleryImages = document.querySelector('.gallery-grid-container')
    elGalleryImages.innerHTML = strHTML

    document.querySelector('.search-bar-input').value = '#' + tag.toLowerCase()
}



function onInitSavedMemes() {
    var elGalleryImages = document.querySelector('.saved-gallery-grid-container')

    var images = getSavedMemes()

    console.log('images:', images)

    var strHTML = ''

    for( var i = 0; i < images.length; i++){
        // TODO: revisit the html datasets lesson and see if there is a better to do this..
        strHTML += `<img src="${images[i]}" >`
    }
    elGalleryImages.innerHTML = strHTML
}





















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

function onUploadButtonClicked() {
    var elImgupload = document.querySelector('.imgupload')
    elImgupload.click()
}





