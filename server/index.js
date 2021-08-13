const express = require('express');
const db = require('../db-psql');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/qa/questions', (req, res) => {
  console.log('REQ PARAM ', req.params);
  console.log('REQ BODY ', req.body);
  console.log('REQ QUERY ', req.query);
  db.getQsByProductId(req.query.product_id, req.query.page||1, req.query.count||5, (err, result) => {
    if (err) {
      console.log('failed to get Qs from server');
      res.sendStatus(404);
    }
    res.status(200).json(result);
  })
});

app.get('/qa/questions/:question_id/answers', (req, res) => {
  console.log('REQ QUERY ', req.query);
  console.log('REQ PARAM ', req.params);
  db.getAnsByQId(req.params.question_id, req.query.page||1, req.query.count||5, (err, result) => {
    if (err) {
      console.log('failed to get answer list from server');
      res.sendStatus(404);
    }
    res.status(200).json(result);
  })
});

app.post('/qa/questions', (req, res) => {
  console.log('REQ BODY ', req.body);
  db.addQ(req.body, (err, result) => {
    if (err) {
      console.log('failed to post newq to server');
      res.sendStatus(404);
    }
    res.status(201).send('Created');
  })
});

app.post('/qa/questions/:question_id/answers', (req, res) => {
  console.log('REQ BODY ', req.body);
  db.addAns(req.params.question_id, req.body, (err, result) => {
    if (err) {
      console.log('failed to post new Answer to server');
      res.sendStatus(404);
    }
    res.status(201).send('Created');
  })
});

app.put('/qa/questions/:question_id/helpful', (req, res) => {
  db.markQhelpfull(req.params.question_id, (err, result) => {
    if (err) {
      console.log('failed to mark Q helpful via server');
      res.sendStatus(404);
    }
    res.sendStatus(204);
  })
});

app.put('/qa/answers/:answer_id/helpful', (req, res) => {
  db.markAhelpful(req.params.answer_id, (err, result) => {
    if (err) {
      console.log('failed to mark A helpful via server');
      res.sendStatus(404);
    }
    res.sendStatus(204);
  })
});

app.put('/qa/questions/:question_id/report', (req, res) => {
  db.reportQ(req.params.question_id, (err, result) => {
    if (err) {
      console.log('failed to report Q via server');
      res.sendStatus(404);
    }
    res.sendStatus(204);
  })
})

app.put('/qa/answers/:answer_id/report', (req, res) => {
  db.reportA(req.params.answer_id, (err, result) => {
    if (err) {
      console.log('failed to report A via server');
      res.sendStatus(404);
    }
    res.sendStatus(204);
  })
})

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});