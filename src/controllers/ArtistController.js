async function post(req, res) {
  req.jobs.scrap(req.body);
  res.send();
}

module.exports = {
  post,
};