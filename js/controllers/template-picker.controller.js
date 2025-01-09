'use strict'


function onInitGallery() {
    var elGalleryImages = document.querySelector('.gallery-grid-container')
    var images = getImages()
    var strHTML = ''

    for( var i = 0; i < images.length; i++){
        // TODO: revisit the html datasets lesson and see if there is a better to do this..
        strHTML += `<img id="img-${images[i].id}" src="${images[i].url}" onclick="onSelectedTemplate(event, this)">`
    }
    elGalleryImages.innerHTML = strHTML
}

function renderGalleryImage(elGalleryImage) {
    // TODO: find a better way to do this if there is time left
    var imgID = elGalleryImage.id.split('-')[1]
    imgID = parseInt(imgID)

    // console.log('imgID:', imgID)
    var images = getImages(imgID)

    // console.log('images:', images[0])
    setMemeImgId(images[0].id)
    renderSelectedImg()
}

function renderSelectedImg(){
    var selectedImg = getMemeImgId()
    const img = new Image()
    img.onload = () => { renderImg(img) }

    console.log('selectedImg:', selectedImg)
    console.log('selectedImg:', getImages(selectedImg))

    img.src = getImages(selectedImg)[0].url
}

function moveToGalleryPage(){
    document.querySelector('.page-gallery').style.display = 'none'
    document.querySelector('.page-editor').style.display = 'contents'

    document.querySelector('.side-page-gallery').style.display = 'none'
    document.querySelector('.side-page-editor').style.display = 'flex'

    onInitMemeEditor()

    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.editor-nav').classList.add('top-bar-active')
}

function onSelectedTemplate(event, element){

    renderGalleryImage(element)
    moveToGalleryPage()

}

function onBackToGallery(event, element){
    document.querySelector('.page-gallery').style.display = 'contents'
    document.querySelector('.page-editor').style.display = 'none'

    document.querySelector('.side-page-gallery').style.display = 'flex'
    document.querySelector('.side-page-editor').style.display = 'none'

    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.gallery-nav').classList.add('top-bar-active')
    hideAllToolbars()
}


// Upload Image
function onUploadBackground(ev) { loadImageFromInput(ev, renderImg) }


function loadImageFromInput(ev, onImageReady) {
    const reader = new FileReader()
    reader.onload = function (event) {
        const img = new Image()
        img.onload = () => { onImageReady(img) }
        img.src = event.target.result
    }
    reader.readAsDataURL(ev.target.files[0])
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
    moveToGalleryPage()
}



