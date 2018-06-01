const request = require('request');
const cheerio = require('cheerio');

module.exports = function() {
  this.cache_html = null;
  this.url = null;

  this.isExists = (url) => {
    this.url = url;
    const self = this;
    return new Promise((resolve, reject) => {
      request(url, (error, response, html) => {
        if(!error) {
          self.cache_html = html;
          resolve();
        } else {
          reject(error)
        }
      });
    });
  };

  this.get = async(url) => {
    if (this.cache_html === null) {
      if (this.url === null) {
        this.url = url;
      }
    }

    this.cache_html = await this.load(this.url);

    return cheerio.load(this.cache_html);
  };

  this.load = (url) => {
    return new Promise((resolve, reject) => {
      request(url, (error, response, html) => {
        if(!error) {
          resolve(html);
        } else {
          reject(error)
        }
      });
    });
  };

  this.getHtml = () => {
    return this.cache_html;
  }
};

// module.exports = async (url) => {
//   //https://www.songkick.com/search?utf8=%E2%9C%93&type=initial&query=degiheugi
//   const url2 = 'https://www.songkick.com/artists/908564-degiheugi';
//   request(url2, (error, response, html) => {
//
//     // First we'll check to make sure no errors occurred when making the request
//
//     if(!error){
//       // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
//
//       var $ = cheerio.load(html);
//       $('.microformat').each(function() {
//         let json = JSON.parse($(this).find('script').html());
//         console.log(json);
//         // json.forEach(function (value) {
//         //   if (value['@type'] !== undefined) {
//         //     if(value['@type'] === 'MusicGroup') {
//         //       Object.assign(data,checkArtist(value));
//         //     }
//         //     else if(value['@type'] === 'MusicEvent') {
//         //       console.log(value);
//         //     }
//         //   }
//         // });
//       });
//     }
//   })
// };