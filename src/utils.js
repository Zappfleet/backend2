const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const config = require("config");
const f2f = require("f2f");
const { PAGE_SIZE } = require("./constants");
const { isString } = require("lodash");

const ENCRYPTION_ALGORITHM = "aes-256-cbc"; //Using AES encryption
const ENCRYPTION_KEY = "idu*s@5eY&diMK&82#uFpLokd)_2kd(@";
const ENCRYPTION_IV = "jd@Il(*12*djWUMc";

class Database {
  static db = null;
}

function plugin(plugin_path) {
  try {
    return require(path.join("../system_plugins/", plugin_path));
  } catch (e) {
    return null;
  }
}

async function getDatabase(url) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url)
      .then((client) => {
        console.log("Successfully connected to url");
        resolve(client);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function generateActivationCode() {
  return `${getRandomInt(100000, 999999)}`;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return parseInt(getRandomFloat(min, max));
}

function encrypt(text) {
  let cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    ENCRYPTION_IV
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
}

// Decrypting text
function decrypt(data) {
  let encryptedData = data;
  let encryptedText = Buffer.from(encryptedData, "hex");

  let decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    ENCRYPTION_IV
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

function keysOf(obj) {
  return Object.entries(obj).map((item) => item[1].key);
}
function filterObject(obj, fields) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => fields.includes(key))
  );
}

function readStatusFilterFromQuery(query) {
  const status = query.status || "";
  return status
    .split(",")
    .map((item) => {
      return item.trim();
    })
    .filter((item) => {
      return item.length > 0;
    });
}

function readDateFilterFromQuery(query) {
  const { gmt_from, gmt_to } = query;

  const dateFilter = {};
  if (gmt_from || gmt_to) {
    dateFilter.gmt_for_date = {};
    gmt_from && (dateFilter.gmt_for_date.$gte = new Date(gmt_from));
    gmt_to && (dateFilter.gmt_for_date.$lt = new Date(gmt_to));
  }
  return dateFilter;
}

function datesAreInSameDay(dates) {
  const check = dates.map((d) => {
    return d.getDate() + d.getMonth() + d.getFullYear();
  });
  const uniq = [...new Set(check)];
  return uniq.length == 1;
}

function parseSort(sort) {
  return JSON.parse(sort || "{}");
}

function getSortFromQuery(query) {
  if (query.path) {
    return { [query.path]: query.order };
  }
  return null;
}

function verifyJwtToken(token) {
  try {
    const decoded = jwt.verify(
      token.startsWith("Bearer") ? token.split(" ")[1] : token,
      config.get("jwtPrivateKey")
    );
    return decoded;
  } catch (e) {
    console.log(e);
    return null;
  }
}

function generateJwtToken(data, ignoreExp) {
  const payload = {
    ...data,
  };

  const minutes = getRandomInt(60, 120);
  if (!ignoreExp) {
    payload.exp = Math.floor(Date.now() / 1000) + 60 * minutes;
  }
  const token = jwt.sign(payload, config.get("jwtPrivateKey"));
  return token;
}

function makeKeyFromText(str) {
  const F2F = new f2f();
  return F2F.simplef2f(str).trim() || str;
}

function getMongoosePaginateOptions(page = 1, sort = {}) {
  if (isString(sort)) sort = JSON.parse(sort);
  return {
    page,
    sort,
    limit: PAGE_SIZE,
    collation: {
      locale: "fa",
    },
  };
}

function replaceArabicCharacters(text) {
  text = text.replace(/\u0643/g, "\u06A9"); // ک
  text = text.replace(/\u0649/g, "\u06CC"); // ی
  text = text.replace(/\u064A/g, "\u06CC"); // ی
  return text;
}

function setStartOfDay(date) {
  // Set the time part of the "from" date to the start of the day (00:00:00)
  return date.setHours(0, 0, 0, 0);
}

function setEndOfDay(date) {
  // Set the time part of the "to" date to the end of the day (23:59:59)
 return date.setHours(23, 59, 59, 999);
}



module.exports = {
  plugin,
  getDatabase,
  encrypt,
  decrypt,
  generateActivationCode,
  getRandomInt,
  getRandomFloat,
  keysOf,
  filterObject,
  readDateFilterFromQuery,
  datesAreInSameDay,
  getSortFromQuery,
  generateJwtToken,
  verifyJwtToken,
  makeKeyFromText,
  readStatusFilterFromQuery,
  getMongoosePaginateOptions,
  replaceArabicCharacters,
  Database,
  setStartOfDay,
  setEndOfDay
};
