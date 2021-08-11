const express = require('express');
const db = require('../db-psql');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/qa/questions/:product_id', (req, res) => {
  console.log('REQ PARAM ', req.params);
  console.log('REQ BODY ', req.body);
  console.log('REQ QUERY ', req.query);
  db.getQsByProductId(req.params.product_id, (err, result) => {
    if (err) {
      console.log('failed to get Qs from server');
      res.sendStatus(404);
    }
    res.status(200).json(result);
  })
});

app.get('/qa/questions/:question_id/answers', (req, res) => {
  db.getAnsByQId(req.params.question_id, (err, result) => {
    if (err) {
      console.log('failed to get answer list from server');
      res.sendStatus(404);
    }
    res.status(200).json(result);
  })
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});