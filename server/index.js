const express = require('express');
const db = require('../db-psql');
const redis = require('redis');
//add db caching tool
const ExpressRedisCache = require('express-redis-cache');
const client = redis.createClient(6379, '18.222.239.196');
client.on('connect', function() {
  console.log('redis Connected!');
});

const app = express();
const PORT = 3000;
const cache = ExpressRedisCache();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/qa/questions/test', (req, res) => {
  res.send('this is a testing endpoint');
});

//loader.io auth
app.get('/loaderio-565a7e46e76c5814f76b1b47e9f6e01b/', (req, res)=> {
  res.send('loaderio-565a7e46e76c5814f76b1b47e9f6e01b');
})

app.get('/qa/questions', cache.route(), (req, res) => { //cache.route(),
  console.log('here! in worker 1');
  let product = req.query.product_id;
  if (!product) {
    res.send('no product id provided, try again...')
  }
  client.get(product, (err, reply) => {
    if (reply !== null) {
      res.status(200).send(reply);
    } else {
      db.getQsByProductId(product, req.query.page||1, req.query.count||5, (err, result) => {
        if (err) {
          console.log('failed to get Qs from server');
          res.sendStatus(404);
        }
        res.status(200).json(result);
        result = JSON.stringify(result);
        client.set(product, result, (err, reply) => {
          if (err) {
            console.log('failed to set in Redis');
          }
        })
      })
    }
  })
});



app.get('/qa/questions/:question_id/answers', (req, res) => {
  // console.log('REQ QUERY ', req.query);
  // console.log('REQ PARAM ', req.params);
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
});

app.put('/qa/answers/:answer_id/report', (req, res) => {
  db.reportA(req.params.answer_id, (err, result) => {
    if (err) {
      console.log('failed to report A via server');
      res.sendStatus(404);
    }
    res.sendStatus(204);
  })
});


app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});


