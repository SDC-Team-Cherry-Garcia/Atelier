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
  pool.query(`select * from questions where productID = ${id};`,(err, results) => { //select * from questions where productID = ${id}
    if (err) {
      console.log('error in loading questions from db');
      console.log(err);
      callback(err);
    }
    callback(null, results.rows);
  });
};

const getAnsByQId = (qid, callback) => {

}
module.exports = {
  getQsByProductId,
  getAnsByQId,
}

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