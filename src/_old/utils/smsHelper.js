const config = require("config");
const { default: axios } = require("axios");

const generateKevenegarPath = (action, method) => {
  return (
    "https://api.kavenegar.com" +
    "/v1/" +
    config.get("KAVEHNEGAR_API_KEY") +
    "/" +
    action +
    "/" +
    method +
    ".json"
  );
};

const sendVerificationSms = async (receptor, token, template, cb) => {
  let smsResult = await axios.get(generateKevenegarPath("verify", "lookup"), {
    params: { receptor, token, template },
  });
  return smsResult?.data;
};
exports.sendVerificationSms = sendVerificationSms;
