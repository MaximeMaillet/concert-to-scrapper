const utm_re = new RegExp('([\?\&]utm_(source|medium|term|campaign|content|cid|reader|name)=[^&#]+)', 'ig');

function removeUtm(url) {
  const queryStringIndex = url.indexOf('?');
  if (url.indexOf('utm_') > queryStringIndex) {
    let stripped = url.replace(utm_re, '');
    if (stripped.charAt(queryStringIndex) === '&') {
      stripped = stripped.substr(0, queryStringIndex) + '?' +
        stripped.substr(queryStringIndex + 1)
    }
    if (stripped !== url) {
      return stripped;
    }
  }

  return url;
}

module.exports = {
  removeUtm
};