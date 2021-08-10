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
  reported boolean,
  helpfulness int
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
  reported boolean,
  helpfulness int,
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

