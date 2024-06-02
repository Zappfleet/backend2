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

module.exports.sendSecretVerificationToken = async function sendSecretVerificationToken(phone, token) {
    let smsResult = await axios.get(generateKevenegarPath("verify", "lookup"), {
        params: { receptor: phone, token, template : config.get("KAVEHNEGAR_TEMP") },
    });
    return smsResult;
}




