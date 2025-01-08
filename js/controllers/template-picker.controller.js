'use strict'


function onSelectedTemplate(event, element){

    document.querySelector('.page-gallery').style.display = 'none'
    document.querySelector('.page-editor').style.display = 'contents'

    document.querySelector('.side-page-gallery').style.display = 'none'
    document.querySelector('.side-page-editor').style.display = 'flex'

    onInitMemeEditor()

    const img = new Image()
    img.onload = () => { renderImg(img) }
    img.src = element.src

    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.editor-nav').classList.add('top-bar-active')

}

function onBackToGallery(event, element){
    document.querySelector('.page-gallery').style.display = 'contents'
    document.querySelector('.page-editor').style.display = 'none'

    document.querySelector('.side-page-gallery').style.display = 'flex'
    document.querySelector('.side-page-editor').style.display = 'none'

    document.querySelector('.top-bar-active').classList.remove('top-bar-active')
    document.querySelector('.gallery-nav').classList.add('top-bar-active')


}