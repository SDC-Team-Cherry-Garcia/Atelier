const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'yukili',
  host: 'localhost',
  database: 'postgres',
  port: 5432
})

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})
pool.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('DB Connected!');
})

const getQsByProductId = (id, callback) => {
  let q = `
  select
    q.id AS question_id,
    q.body AS question_body,
    q.datedate AS question_date,
    q.userName AS asker_name,
    q.reported AS reported,
    q.helpfulness AS question_helpfulness,
    ans AS answers
  from questions q
  left join (
    select
      qID,
      json_agg(
        json_build_object(
          'id', a.id,
          'body', a.body,
          'date', a.datedate,
          'answerer_name', a.userName,
          'helpfulness', a.helpfulness,
          'photos', pho
        )
      ) ans
    from
      answers a
      left join (
        select
          answer,
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.photoUrl
            )
          ) pho
        from photos p
        group by answer
      ) p on p.answer = a.id
    group by qID
  ) a on q.id = a.qID
  where q.productID = ${id};
  `
  pool.query(q, (err, data) => {
    if (err) {
      console.log('error in loading questions from db');
      console.log(err);
      callback(err);
    }
    let resObj = {};
    resObj['product_id'] = id;
    resObj.results = data.rows;
    callback(null, resObj);
  });
};

const getAnsByQId = (qid, callback) => {
  let q = `
  select
    json_build_object(
      'results', json_agg(
        json_build_object(
          'answer_id', a.id,
          'body', a.body,
          'date', a.datedate,
          'answererName', a.username,
          'helpfulness', a.helpfulness,
          'photos', photo
        )
      )
    ) results
  from answers a
  left join (
      select
          answer,
          json_agg(
              json_build_object(
                  'id', p.id,
                  'url', p.photoUrl
              )
          ) photo
      from
          photos p
      group by answer
  ) p
  on p.answer = a.id
  where a.qID = ${qid};
  `;
  pool.query(q, (err, results) => {
      if (err) {
        console.log('error in loading answers from db');
        console.log(err);
        callback(err);
      }
      let resObj = {};
      resObj.question = qid;
      resObj.results = results.rows[0].results.results;
      callback(null, resObj);
    })
};

module.exports = {
  getQsByProductId,
  getAnsByQId,
}

// select * from answers a
// left join photos p on p.answer = a.id
// where a.qID = 1;

// {
//   productID: Number,
//   questions: {
//     id: Number,
//     body: String,
//     qDate: Date,
//     asker: String,
//     helpfulness: Number,
//     reported: Boolean,
//     answers: {
//       id: {
//         id: Number,
//         body: String,
//         aDate: Date,
//         asnwerer: String,
//         helpfulness: Number,
//         photos: {
//           id: Number,
//           url: String
//         }
//       }
//     }
//   }
// }

// select array_to_json(array_agg(row_to_json(x)))
// from (
//   select id, body from answers
//   where qID=1
// )x;

// select answer_id, body, date,answererName,helpfulness,
//   (
//     select array_to_json(array_agg(row_to_json(d)))
//     from (
//       select id, photoUrl
//       from photos
//       where answer in (select id from answers where qID = 1)
//     ) d
//   )
// from(
//   select
//     a.id AS answer_id,
//     a.body AS body,
//     a.adate AS date,
//     a.username AS answererName,
//     a.helpfulness AS helpfulness,
//     p.id AS id,
//     p.photoUrl AS url
//   from answers a
//   left join photos p on p.answer = a.id

// from answers a
// where a.qID = 1
// ) y;

// select
//     json_build_object(
//         'answer_id', json_agg(
//             json_build_object(
//                 'id', p.id,
//                 'url', p.photoUrl
//             )
//         )
//     ) photo
// from photos p

//============SOLUTIONS HERE=================
// select
//   json_build_object(
//     'results', json_agg(
//       json_build_object(
//         'answer_id', a.id,
//         'body', a.body,
//         'date', a.adate,
//         'answererName', a.username,
//         'helpfulness', a.helpfulness,
//         'photos', photo
//       )
//     )
//   ) results
// from answers a
// left join (
//     select
//         answer,
//         json_agg(
//             json_build_object(
//                 'id', p.id,
//                 'url', p.photoUrl
//             )
//         ) photo
//     from
//         photos p
//     group by answer
// ) p
// on p.answer = a.id
// where a.qID = 1;

// {"results" : [
//   {"answer_id" : 5,
//   "body" : "Something pretty soft but I can't be sure",
//   "date" : 1599990560555,
//   "answererName" : "metslover",
//   "helpfulness" : 5,
//   "photos" : [{"id" : 1, "url" : "https://images.unsplash.com/photo-1530519729491-aea5b51d1ee1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1651&q=80"}, {"id" : 2, "url" : "https://images.unsplash.com/photo-1511127088257-53ccfcc769fa?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"}, {"id" : 3, "url" : "https://images.unsplash.com/photo-1500603720222-eb7a1f997356?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1653&q=80"}]},
//   {"answer_id" : 7, "body" : "Its the best! Seriously magic fabric", "date" : 1614451524662, "answererName" : "metslover", "helpfulness" : 7, "photos" : null},
//   {"answer_id" : 8, "body" : "DONT BUY IT! It's bad for the environment", "date" : 1600552162548, "answererName" : "metslover", "helpfulness" : 8, "photos" : null},
//   {"answer_id" : 57, "body" : "Suede", "date" : 1618159891495, "answererName" : "metslover", "helpfulness" : 7, "photos" : null},
//   {"answer_id" : 95, "body" : "Supposedly suede, but I think its synthetic", "date" : 1600120432219, "answererName" : "metslover", "helpfulness" : 3, "photos" : null}
// ]}

// select
//   q.id AS question_id,
//   q.body AS question_body,
//   q.qDate AS question_date,
//   q.userName AS asker_name,
//   q.reported AS reported,
//   q.helpfulness AS question_helpfulness,
//   ans AS answers
// from questions q
// left join (
//   select
//     qID,
//     json_build_object( id,
//       json_build_object(
//         'id', a.id,
//         'body', a.body,
//         'date', a.aDate,
//         'answerer_name', a.userName,
//         'helpfulness', a.helpfulness,
//         'photos', pho
//       )
//     ) ans
//   from
//     answers a
//     left join (
//       select
//         answer,
//         json_agg(
//           json_build_object(
//             'id', p.id,
//             'url', p.photoUrl
//           )
//         ) pho
//       from photos p
//       group by answer
//     ) p on p.answer = a.id
//   group by qID
// ) a on q.id = a.qID
// where q.id = 1;
