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