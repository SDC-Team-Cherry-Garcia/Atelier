const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'postgres',
  host: '3.15.158.201',
  database: 'atelier',
  password: 'hebe001',
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

const getQsByProductId = (id, page, count, callback) => {
  // let offset = (page - 1) * count;
  let q = `
  with sub_ans as (
    select * from answers
    where qID in (select id from questions where productID=${id} and reported = false)
  )
  , sub_q as (
    select * from questions
    where productID = ${id} and reported = false
  ), sub_photo as (
    select * from photos
    where answer in (
      select id from answers
      where qID in (
        select id from questions where productID=${id} and reported = false
      ) and reported = false
    )
  )
  select
    q.id AS question_id,
    q.body AS question_body,
    q.datedate AS question_date,
    q.userName AS asker_name,
    q.reported AS reported,
    q.helpfulness AS question_helpfulness,
    ans AS answers
  from sub_q q
  left join (
    select
      qID,
      jsonb_combine(
        json_build_object(
          a.id,
          json_build_object(
            'id', a.id,
            'body', a.body,
            'date', a.datedate,
            'answerer_name', a.userName,
            'helpfulness', a.helpfulness,
            'photos', pho
          )
        ) ::jsonb
      ) ans
    from
      sub_ans a
      left join (
        select
          answer,
          json_agg(
            json_build_object(
              'id', p.id,
              'url', p.photoUrl
            )
          ) pho
        from sub_photo p
        group by answer
      ) p on p.answer = a.id
    group by qID
  ) a on q.id = a.qID
  ;
  `
  pool.query(q, (err, data) => {
    if (err) {
      console.log('error in loading questions from db');
      console.log(err);
      callback(err);
    }
    let resObj = {};
    resObj['product_id'] = id;
    resObj.page = page;
    resObj.count = count;
    let start = (page - 1) * count;
    let end = page * count;
    resObj.results = data.rows.slice(start, end);
    callback(null, resObj);
  });
};

const getAnsByQId = (qid, page, count, callback) => {
  // let offset = (page - 1) * count
  // console.log('OFFSET: ', offset);
  let q = `
  with sub_ans as (
    select * from answers
    where qID = ${qid} and reported = false
  )
  , sub_photo as (
    select * from photos
    where answer in (select id from answers where qID = ${qid} and reported = false)
  )
  select
    a.id AS answer_id,
    a.body AS body,
    a.datedate AS date,
    a.username AS answererName,
    a.helpfulness AS helpfulness,
    photo AS photos
  from sub_ans a
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
          sub_photo p
      group by answer
  ) p
  on p.answer = a.id
  ;
  `;
  pool.query(q, (err, results) => {
      if (err) {
        console.log('error in loading answers from db');
        console.log(err);
        callback(err);
      }
      let resObj = {};
      resObj.question = qid;
      resObj.page = page;
      resObj.count = count;
      let start = (page - 1) * count;
      let end = page * count;
      resObj.results = results.rows.slice(start, end);
      callback(null, resObj);
    })
};

const addQ = (newq, callback) => {
  let q = `
  insert into questions (productID, body, userName, userEmail)
  values ('${newq.product_id}', '${newq.body}', '${newq.name}', '${newq.email}')
  `;
  pool
    .query(q)
    .then(()=> {callback(null, )})
    .catch((err)=> {
      console.log('error in creating Q in db');
      console.log(err);
      callback(err);
    })
};

const addAns = (id, newans, callback) => {
  // let log = `array[${newans.photos}]`
  // console.log('PHOTO ARRAY ', log)
  let q;
  if (!newans.photos.length) {
    q = `
    insert into answers (qID, body, userName, userEmail)
    values ('${id}', '${newans.body}', '${newans.name}', '${newans.email}');
    `
  } else {
    urlStr = '';
    for (let i = 0; i < newans.photos.length; i ++) {
      urlStr += `'${newans.photos[i]}'` + ', ';
    }
    urlStr = urlStr.slice(0, -2);
    let log = `array[${urlStr}]`
    console.log('urlStr ', log);
    q = `
    with ins1 as (
      insert into answers (qID, body, userName, userEmail)
      values ('${id}', '${newans.body}', '${newans.name}', '${newans.email}')
      returning id
    )
    insert into photos (answer, photoUrl)
    values ((select id from ins1), unnest(array[${urlStr}]))
    `;
  }
  pool
    .query(q)
    .then(()=> {callback(null, )})
    .catch((err)=> {
      console.log('error in creating ANS in db');
      console.log(err);
      callback(err);
    })
};

const markQhelpfull = (qid, callback) => {
  let q = `
  update questions
  set helpfulness = (
    select helpfulness + 1
    from questions
    where id = ${qid}
  )
  where id = ${qid}
  `;
  pool
    .query(q)
    .then(()=> {callback(null, )})
    .catch((err)=> {
      console.log('error in marking Q helpful in db');
      console.log(err);
      callback(err);
    })
};

const markAhelpful = (aid, callback) => {
  let q = `
  update answers
  set helpfulness = (
    select helpfulness + 1
    from answers
    where id = ${aid}
  )
  where id = ${aid};
  `;
  pool
    .query(q)
    .then(()=> {callback(null, )})
    .catch((err)=> {
      console.log('error in marking A helpful in db');
      console.log(err);
      callback(err);
    })
};

const reportQ = (qid, callback) => {
  let q = `
  update questions
  set reported = true
  where id = ${qid};
  `;
  pool
    .query(q)
    .then(()=> {callback(null, )})
    .catch((err)=> {
      console.log('error in report Q in db');
      console.log(err);
      callback(err);
    })
};

const reportA = (aid, CB) => {
  let q = `
  update answers
  set reported = true
  where id = ${aid};
  `;
  pool
    .query(q)
    .then(()=> {CB(null, )})
    .catch((err)=> {
      console.log('error in report Q in db');
      console.log(err);
      CB(err);
    });
};

module.exports = {
  getQsByProductId,
  getAnsByQId,
  addQ,
  addAns,
  markQhelpfull,
  markAhelpful,
  reportQ,
  reportA
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

//>>>>>>>>>>TO BUILD {id: {}}<<<<<<<<<<<<<<<<<
// select
//   jsonb_combine(
//     json_build_object(
//       id,
//       json_build_object(
//         'answerer', userName,
//         'body', body,
//         'date', datedate
//       )
//     ) ::jsonb
//   ) ans
// from answers
// where qid = 1;

// select
//   'answer_id', a.id,
//   'body', a.body,
//   'date', a.datedate,
//   'answererName', a.username,
//   'helpfulness', a.helpfulness,
//   'photos', photo
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
// where a.qID = 1 and a.reported = false
// LIMIT 2 OFFSET 0;

// select
//   q.id AS question_id,
//   q.body AS question_body,
//   q.datedate AS question_date,
//   q.userName AS asker_name,
//   q.reported AS reported,
//   q.helpfulness AS question_helpfulness,
//   ans AS answers
// from questions q
// left join (
//   select
//     qID,
//     jsonb_combine(
//       json_build_object(
//         a.id,
//         json_build_object(
//           'id', a.id,
//           'body', a.body,
//           'date', a.datedate,
//           'answerer_name', a.userName,
//           'helpfulness', a.helpfulness,
//           'photos', pho
//         )
//       ) ::jsonb
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
//     where a.reported = false
//   group by qID
// ) a on q.id = a.qID
// where q.productID = 1 and q.reported = false
// limit 2 offset 0;

//>>>>CORRECT ANSWERS VERSION I<<<<
// select
//     json_build_object(
//       'results', json_agg(
//         json_build_object(
//           'answer_id', a.id,
//           'body', a.body,
//           'date', a.datedate,
//           'answererName', a.username,
//           'helpfulness', a.helpfulness,
//           'photos', photo
//         )
//       )
//     ) results
//   from answers a
//   left join (
//       select
//           answer,
//           json_agg(
//               json_build_object(
//                   'id', p.id,
//                   'url', p.photoUrl
//               )
//           ) photo
//       from
//           photos p
//       group by answer
//   ) p
//   on p.answer = a.id
//   where a.qID = ${qid} and a.reported = false;