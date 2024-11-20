const mongoose = require("mongoose");
const config = require("config");
const logger = require("../middleware/logger");

exports.db = async function (callback) {
  let db = "";
  const environment_name = config.get("environment_name");

  try {
    if (environment_name === "local") {
      db = config.get("db");
      mongoose.set('strictQuery', false);
      await mongoose.connect(db)//, { useNewUrlParser: true, useUnifiedTopology: true });
    //  await mongoose.connect(db, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    //   connectTimeoutMS: 30000, // زمان انتظار 30 ثانیه
    //   serverSelectionTimeoutMS: 30000 // زمان انتخاب سرور 30 ثانیه
    // });
    
    }
    if (environment_name === "server") {
      db = config.get("db_SERVER");
      mongoose.set('strictQuery', false);
      await mongoose.connect(db);

    }

    logger.info(`Connected to database`);
    console.log('Successfully connected to MongoDB');

    if (callback) {
      callback();
    }
  } catch (error) {
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      logger.error('MongooseServerSelectionError:', error.message);
      console.error(100, 'MongooseServerSelectionError:', error.message);
    } else {
      logger.error('Unexpected Error:', error);
      console.error(200, 'Unexpected Error:', error);
    }
    process.exit(1); // Exit process with failure code
  }
};
