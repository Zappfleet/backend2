const { default: mongoose } = require("mongoose");
const { getRandomInt } = require("./utils");

class FakeHttpRequest {

    constructor(db) {
        this.db = db;
    }

    setBody(body) {
        this.body = body;
    }
    setQueryParams(query) {
        this.query = query;
    }
    setPathParams(params) {
        this.params = params;
    }
    setHeaders(headers) {
        this.headers = headers;
    }
}

class FakeHttpResponse {

    constructor(onResponse) {
        this.onResponse = onResponse;
    }

    status(status) {
        this.status = status;
        return this;
    }
    send(data) {
        this.onResponse(data);
    }
    json(data) {
        this.onResponse(data);
    }


}

const DropDatabase = async function () {
    mongoose.connection.close();
    mongoose.connection.db.dropDatabase();
}

const ConnectDatabase = async function (post_fix) {
    const testDb = `mongodb://127.0.0.1:27017/zappfleet-testdata_${post_fix}`
    mongoose.set('strictQuery', false);
    return await mongoose.connect(testDb, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000 ,
    })
};


module.exports = {
    FakeHttpRequest,
    FakeHttpResponse,
    ConnectDatabase,
    DropDatabase
}