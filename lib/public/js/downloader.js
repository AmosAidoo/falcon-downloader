const homedir = require('os').homedir
const url = require('url')
const { https, http } = require('follow-redirects')

class Download {
  constructor (link, filename, uid, dlOb) {
    this.link = link
    this.filename = filename
    this.uid = uid
    this.filepath = `${homedir}/Downloads/${filename}`
    this.dl = dlOb.download(link, this.filepath)
    this.new = 0
  }

  startDownload () {
    let proto = url.parse(this.link).protocol
    let options = {
      threadCount: 5
    }

    this.dl.setRetryOptions({
      retryInterval: 5000
    })
    // checking protocol and following redirect urls
    if (proto == 'https:') {
      options = {
        threadCount: 5,
        port: 443
      }
      // follow if link redirects
      https.get(this.link, (response) => {
        this.dl.url = response.responseUrl
        console.log(this.link)
        this.dl.setOptions(options)
        this.dl.start()
        this.anodaStartDownload()
      }).on('error', function (err) {
        console.error(err)
      })
    } else {
      http.get(this.link, (response) => {
        this.dl.url = response.responseUrl
        this.dl.setOptions(options)
        this.dl.start()
        this.anodaStartDownload()
      }).on('error', function (err) {
        console.error(err)
      })
    }
  }

  anodaStartDownload () {
    console.log(this.dl)
    this.injectCode()
    $(`#${this.uid} .dl-title`).text(this.filename)
    $(`#${this.uid} .progress`).progress({ percent: 0 })
    var notStarted = 0
    var retryAgain = 0
    var timer = setInterval(() => {
      switch (this.dl.status) {
        case 0:
          if (retryAgain <= 5) {
            notStarted++
            if (notStarted >= 15) {
              this.dl.start()
              notStarted = 0
              retryAgain++
            }
          }
          break
        case 1:
          let stats = this.dl.getStats()
          let compl = stats.total.completed || 0
          let speed = (parseInt(stats.present.speed / 1024) || 0) + ' Kb/s'
          $(`#${this.uid} .dl-speed`).text(speed)
          $(`#${this.uid} .progress`).progress({ percent: compl })
          $(`#${this.uid} .progress .label`).text(`${compl}%`)
          break
        case 2:
          break
        case -1:
          clearInterval(timer)
          break
        default:
      }
    }, 1000)
    this.dl.on('start', () => {
      if (this.new != 0) {
        $(`#${this.uid} .cntrl i`).removeClass('play').addClass('pause')
      }
      console.log(this.dl)
      console.log(this.filename + ' dl started!!!')
    })
    this.dl.on('stopped', () => {
      $(`#${this.uid} .cntrl i`).removeClass('pause').addClass('play')
      this.new++
      console.log(this.filename + ' stopped!!!')
    })
    this.dl.on('end', () => {
      $(`#${this.uid} .dl-speed`).text('0 Kb/s')
      $(`#${this.uid} .progress`).progress({ percent: 100 })
      $(`#${this.uid} .progress .label`).text(`100%`)
      $(`#${this.uid} .cntrl`).hide()
      console.log(this.filename + 'download complete')
    })
    this.dl.on('error', () => {
      $(`#${this.uid} .cntrl i`).removeClass('pause').addClass('play')
      $(`#${this.uid} .progress .label`).text(`error!!!`)
      this.new++
      console.log('error downloading ' + this.filename)
    })
  }

  injectCode () {
    let code = `<tr id="${this.uid}">
                  <td class="dl-title">The begining of all</td>
                  <td><div class="ui small indicating progress" >
                      <div class="bar" style="width: 0%">
                      </div>
                      <div class="label">0%</div>
                    </div></td>
                  <td class="dl-speed">0 kb/s</td>
                  <td class="dl-time">Nan mins</td>
                  <td><div class="ui icon buttons">
                      <button class="ui button cntrl" onclick="toggleState('${this.link}','${this.uid}')"><i class="pause icon"></i></button>
                      <button class="ui button stp" onclick="stop('${this.link}','${this.uid}')"><i class="stop icon"></i></button>
                      <button class="ui button trsh" onclick="trash('${this.link}','${this.uid}')"><i class="trash icon"></i></button>
                    </div></td>
                </tr>`
    $('tbody').prepend(code)
  }
}

module.exports = Download
