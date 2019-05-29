const { ipcRenderer } = require('electron')
const url = require('url')
const path = require('path')
const uidGenerator = require('uid-generator')
const ytApi = 'https://api.youtubemultidownloader.com/video'

const MTdl = require('mt-files-downloader')
const downloader = new MTdl()

// when add link is clicked from menu
ipcRenderer.on('show-modal', function (event, args) {
  $('.ui.modal').modal('show')
  event.returnValue = 'OK'
})

function doYouTubeThings (link) {
  $.get(ytApi, { url: link }, function (data) {
    if (data.status) {
      for (let i = 0; i < data.format.length; i++) {
        let vid = data.format[i]
        if (vid.height === 720 && vid.ext === 'mp4') {
          downloadItem(data.title, vid.url)
          break
        }
      }
    }
  })
}

ipcRenderer.on('download-youtube', function (event, link) {
  link = decodeURIComponent(link) + ' '
  let id = link.match(/[v][\/|=|%]([a-zA-Z-\d]+)[&|?|\s]/) ||
    link.match(/youtu.be\/([A-Za-z-\d]+)/) ||
    link.match(/embed\/([A-Za-z-\d]+)/)
  if (id) {
    id = id[1]
    // do some youtube download link extraction here
    doYouTubeThings(link)
  }
})

// when the show link modal is clicked
$('.add-link').click(function () {
  $('.ui.modal').modal('show')
})

function downloadItem (name, link) {
  let parsed = url.parse(link)
  if (!name) {
    name = path.basename(parsed.pathname)
    name = decodeURIComponent(name)
  }
  let id = new uidGenerator(null, uidGenerator.BASE16, 6).generateSync()
  let newDl = new download(link, name, id, downloader)
  newDl.startDownload()
}

// when the download is started by link
$('.dl-btn').click(function () {
  let link = $('.dl-link').val()
  downloadItem(false, link)
})

// when the YouTube button is clicked
$('.youtube-btn').click(function () {
  ipcRenderer.send('show-youtube')
})

function toggleState (_url, _uid) {
  let dl = downloader.getDownloadByUrl(_url)
  let elem = $(`#${_uid} .cntrl i`)
  if (dl.status == 1) {
    dl.stop()
    if (elem.hasClass('pause')) {
      elem.removeClass('pause').addClass('play')
    }
  } else {
    dl.resume()
    if (elem.hasClass('play')) {
      elem.removeClass('play').addClass('pause')
    }
  }
}
function stop (_url, _uid) {
  let dl = downloader.getDownloadByUrl(_url)
  let elem = $(`#${_uid} .cntrl i`)
  dl.destroy()
  if (elem.hasClass('pause')) {
    elem.removeClass('pause').addClass('play')
  }
}
function trash (_url, _uid) {
  let dl = downloader.getDownloadByUrl(_url)
  if (dl.status != -3) {
    dl.destroy()
  }
  console.log('Num of downlaods: ' + downloader.getDownloads().length)
  if (downloader.removeDownloadByFilePath(dl.filePath)) {
    $(`#${_uid}`).remove()
  } else {
    console.log('error removing dl!!!')
  }
  console.log('Num of downlaods: ' + downloader.getDownloads().length)
}
