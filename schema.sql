DROP DATABASE IF EXISTS atelier;

CREATE DATABASE atelier;
\c atelier;

DROP TABLE IF EXISTS products CASCADE;
-- CREATE TABLE products (
--   id int PRIMARY KEY,
--   sellerID int
-- );

DROP TABLE IF EXISTS users CASCADE;
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   username varchar(255),
--   email varchar(100)
-- );

DROP TABLE IF EXISTS questions CASCADE;
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  productID int not null,
  body varchar(1000),
  qDate bigint,
  -- user int,
  userName varchar(255),
  userEmail varchar(100),
  reported boolean DEFAULT false,
  helpfulness int DEFAULT O
  -- FOREIGN KEY(productID) REFERENCES products(id),
  -- FOREIGN KEY(userID) REFERENCES users(id)
);

DROP TABLE IF EXISTS answers CASCADE;
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  qID int not null,
  body varchar(1000),
  aDate bigint,
  -- userID int,
  userName varchar(255),
  userEmail varchar(100),
  reported boolean DEFAULT false,
  helpfulness int DEFAULT O,
  -- PRIMARY KEY(id),
  FOREIGN KEY(qID) REFERENCES questions(id)
  -- FOREIGN key(userID) REFERENCES users(id)
);

DROP TABLE IF EXISTS photos CASCADE;
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  photoUrl text,
  answer int not null,
  -- PRIMARY KEY(id),
  FOREIGN KEY(answer) REFERENCES answers(id)
);

-- Data Migration --
COPY questions
FROM '/Users/yukili/Projects/HackPrep/data4Atelier/questions.csv'
DELIMITER ','
CSV HEADER;

COPY answers
FROM '/Users/yukili/Projects/HackPrep/data4Atelier/answers.csv'
DELIMITER ','
CSV HEADER;

COPY photos(id, answer, photoUrl)
FROM '/Users/yukili/Projects/HackPrep/data4Atelier/answers_photos.csv'
DELIMITER ','
CSV HEADER;

-- select to_timestamp(qDate/1000)
-- from questions
-- limit 5;
ALTER TABLE questions
ADD datedate timestamp;

UPDATE questions
SET datedate = to_timestamp(qDate/1000);

ALTER TABLE answers
ADD datedate timestamp;

UPDATE answers
SET datedate = to_timestamp(aDate/1000);

--SET default values
ALTER TABLE questions
ALTER COLUMN reported
SET DEFAULT false;
ALTER TABLE answers
ALTER COLUMN reported
SET DEFAULT false;
ALTER TABLE questions
ALTER COLUMN helpfulness
SET DEFAULT 0;
ALTER TABLE answers
ALTER COLUMN helpfulness
SET DEFAULT 0;

ALTER TABLE questions
ALTER COLUMN datedate
SET DEFAULT CURRENT_TIMESTAMP(4);
ALTER TABLE answers
ALTER COLUMN datedate
SET DEFAULT CURRENT_TIMESTAMP(4);

ALTER SEQUENCE public.questions_id_seq
RESTART WITH 3600000;
ALTER SEQUENCE public.answers_id_seq
RESTART WITH 7000000;
ALTER SEQUENCE public.photos_id_seq
RESTART WITH 2100000;

-- define a new aggregation method
CREATE AGGREGATE jsonb_combine(jsonb)
(
  SFUNC = jsonb_concat(jsonb, jsonb),
  STYPE = jsonb
);

-- indexing
CREATE INDEX productid_index ON questions(productID);--
CREATE INDEX answers_qID_index ON answers(qID);--
CREATE INDEX qID_aID_index ON answers(qID, id);
CREATE INDEX aID_pID_index ON photos(answer, id);--
CREATE INDEX photo_ansid_index ON photos (answer);
CREATE INDEX pid_qid_index ON questions(productID, id);
CREATE INDEX qid_pid_index ON questions(id, productID);



select jsonb_combine(
  json_build_object(
    a.id,
    json_build_object(
      'id', a.id,
      'body', a.body,
      'date', a.datedate,
      'answerer_name', a.userName,
      'helpfulness', a.helpfulness
    )
  ) ::jsonb
)
from answers a
WHERE a.qID = 5;

select
  a.qID,
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
from answers a
WHERE a.qID = 5 and a.reported = false
join (
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
group by a.qID;

select
  q.id AS question_id,
  q.body AS question_body,
  q.datedate AS question_date,
  q.userName AS asker_name,
  q.reported AS reported,
  q.helpfulness AS question_helpfulness,
  json_build_object(
    'id', a.id,
    'body',a.body,
    'date', a.datedate,
    'answerer_name', a.username,
    'helpfulness', a.helpfulness,
    'photos',
      json_build_object(
        'id', p.id,
        'url', p.photoUrl
      )
  )
from questions q
left join answers a on q.id = a.qID
left join photos p on a.id = p.answer
where q.productID = 1

     3600000 | are you doing SDC?                  | 2021-08-11 19:58:36.7081 | spongebob   | f        |                    1 | {"id" : null, "body" : null, "date" : null, "answerer_name" : null, "helpfulness" : null, "photos" : {"id" : null, "url" : null}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 5, "body" : "Something pretty soft but I can't be sure", "date" : "2020-09-13T05:49:20", "answerer_name" : "metslover", "helpfulness" : 5, "photos" : {"id" : 1, "url" : "https://images.unsplash.com/photo-1530519729491-aea5b51d1ee1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1651&q=80"}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 5, "body" : "Something pretty soft but I can't be sure", "date" : "2020-09-13T05:49:20", "answerer_name" : "metslover", "helpfulness" : 5, "photos" : {"id" : 2, "url" : "https://images.unsplash.com/photo-1511127088257-53ccfcc769fa?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 5, "body" : "Something pretty soft but I can't be sure", "date" : "2020-09-13T05:49:20", "answerer_name" : "metslover", "helpfulness" : 5, "photos" : {"id" : 3, "url" : "https://images.unsplash.com/photo-1500603720222-eb7a1f997356?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1653&q=80"}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 7, "body" : "Its the best! Seriously magic fabric", "date" : "2021-02-27T13:45:24", "answerer_name" : "metslover", "helpfulness" : 7, "photos" : {"id" : null, "url" : null}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 8, "body" : "DONT BUY IT! It's bad for the environment", "date" : "2020-09-19T17:49:22", "answerer_name" : "metslover", "helpfulness" : 8, "photos" : {"id" : null, "url" : null}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 57, "body" : "Suede", "date" : "2021-04-11T12:51:31", "answerer_name" : "metslover", "helpfulness" : 7, "photos" : {"id" : null, "url" : null}}
           1 | What fabric is the top made of?     | 2020-07-27 17:18:34      | yankeelover | f        |                    1 | {"id" : 95, "body" : "Supposedly suede, but I think its synthetic", "date" : "2020-09-14T17:53:52", "answerer_name" : "metslover", "helpfulness" : 3, "photos" : {"id" : null, "url" : null}}
           2 | HEY THIS IS A WEIRD QUESTION!!!!?   | 2021-02-21 01:16:59      | jbilas      | t        |                    4 | {"id" : 30, "body" : "Its a rubber sole", "date" : "2021-03-20T22:29:56", "answerer_name" : "dschulman", "helpfulness" : 2, "photos" : {"id" : 13, "url" : "https://images.unsplash.com/photo-1528318269466-69d920af5dad?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"}}
           2 | HEY THIS IS A WEIRD QUESTION!!!!?   | 2021-02-21 01:16:59      | jbilas      | t        |                    4 | {"id" : 75, "body" : "The rubber on the bottom wears thin quickly", "date" : "2020-05-04T22:15:50", "answerer_name" : "dschulman", "helpfulness" : 2, "photos" : {"id" : null, "url" : null}}
           2 | HEY THIS IS A WEIRD QUESTION!!!!?   | 2021-02-21 01:16:59      | jbilas      | t        |                    4 | {"id" : 84, "body" : "Rubber", "date" : "2021-03-16T00:17:56", "answerer_name" : "dschulman", "helpfulness" : 3, "photos" : {"id" : null, "url" : null}}
           2 | HEY THIS IS A WEIRD QUESTION!!!!?   | 2021-02-21 01:16:59      | jbilas      | t        |                    4 | {"id" : 102, "body" : "Some kind of recycled rubber, works great!", "date" : "2020-09-24T22:30:12", "answerer_name" : "dschulman", "helpfulness" : 6, "photos" : {"id" : null, "url" : null}}
           3 | Does this product run big or small? | 2020-12-21 02:31:47      | jbilas      | f        |                    8 | {"id" : null, "body" : null, "date" : null, "answerer_name" : null, "helpfulness" : null, "photos" : {"id" : null, "url" : null}}
           4 | How long does it last?              | 2020-07-09 20:35:17      | funnygirl   | f        |                    6 | {"id" : 65, "body" : "It runs small", "date" : "2020-11-19T06:11:47", "answerer_name" : "dschulman", "helpfulness" : 1, "photos" : {"id" : 14, "url" : "https://images.unsplash.com/photo-1470116892389-0de5d9770b2c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1567&q=80"}}
           4 | How long does it last?              | 2020-07-09 20:35:17      | funnygirl   | f        |                    6 | {"id" : 65, "body" : "It runs small", "date" : "2020-11-19T06:11:47", "answerer_name" : "dschulman", "helpfulness" : 1, "photos" : {"id" : 15, "url" : "https://images.unsplash.com/photo-1536922645426-5d658ab49b81?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"}}
           4 | How long does it last?              | 2020-07-09 20:35:17      | funnygirl   | f        |                    6 | {"id" : 89, "body" : "Showing no wear after a few months!", "date" : "2020-09-02T19:33:29", "answerer_name" : "sillyguy", "helpfulness" : 8, "photos" : {"id" : null, "url" : null}}
           5 | Can I wash it?                      | 2020-12-24 19:14:44      | cleopatra   | f        |                    7 | {"id" : 64, "body" : "It says not to", "date" : "2020-05-04T22:15:50", "answerer_name" : "ceasar", "helpfulness" : 0, "photos" : {"id" : null, "url" : null}}
           5 | Can I wash it?                      | 2020-12-24 19:14:44      | cleopatra   | f        |                    7 | {"id" : 46, "body" : "I've thrown it in the wash and it seems fine", "date" : "2020-11-22T00:27:23", "answerer_name" : "marcanthony", "helpfulness" : 8, "photos" : {"id" : null, "url" : null}}
           5 | Can I wash it?                      | 2020-12-24 19:14:44      | cleopatra   | f        |                    7 | {"id" : 92, "body" : "Haha, are you serious?", "date" : "2020-09-17T04:12:11", "answerer_name" : "ceasar", "helpfulness" : 0, "photos" : {"id" : null, "url" : null}}
           5 | Can I wash it?                      | 2020-12-24 19:14:44      | cleopatra   | f        |                    7 | {"id" : 96, "body" : "I wouldn't machine wash it", "date" : "2020-05-27T09:03:41", "answerer_name" : "ceasar", "helpfulness" : 0, "photos" : {"id" : null, "url" : null}}
           5 | Can I wash it?                      | 2020-12-24 19:14:44      | cleopatra   | f        |                    7 | {"id" : 101, "body" : "Only if you want to ruin it!", "date" : "2020-05-27T09:03:41", "answerer_name" : "ceasar", "helpfulness" : 5, "photos" : {"id" : null, "url" : null}}
           5 | Can I wash it?                      | 2020-12-24 19:14:44      | cleopatra   | f        |                    7 | {"id" : 107, "body" : "Yes", "date" : "2021-01-13T03:47:26", "answerer_name" : "Seller", "helpfulness" : 4, "photos" : {"id" : null, "url" : null}}
           6 | Is it noise cancelling?             | 2020-12-24 19:14:44      | coolkid     | t        |                   19 | {"id" : 108, "body" : "No?", "date" : "2021-04-17T05:27:17", "answerer_name" : "warmkid", "helpfulness" : 14, "photos" : {"id" : null, "url" : null}}


EXPLAIN
with sub_ans as (
  select * from answers
  where qID = 1 and reported = false
)
, sub_photo as (
  select * from photos
  where answer in (select id from answers where qID = 1 and reported = false)
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

EXPLAIN
with sub_ans as (
  select * from answers
  where qID in (select id from questions where productID=1 and reported = false)
)
, sub_q as (
  select * from questions
  where productID = 1 and reported = false
), sub_photo as (
  select * from photos
  where answer in (
    select id from answers
    where qID in (
      select id from questions where productID=1 and reported = false
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