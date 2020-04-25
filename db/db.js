let mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const db = require("../config/keys");

class Database {
  // contains the logic for the Database
  constructor() {
    this.db_connect();
  }
  db_connect() {
    mongoose
      .connect(db.mongoURI, { useNewUrlParser: true })
      .then(() => {
        console.log("Database connection successful");
      })
      .catch(err => {
        console.error(err);
      });
  }
}
module.exports = new Database();
