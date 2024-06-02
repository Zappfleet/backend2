function textIsNumeric(text) {
    if (!text) return false;
    return /^-?\d+$/.test(text);
}

function replaceArabicCharacters(text) {
    text = text.replace(/\u0643/g, '\u06A9'); // ک
    text = text.replace(/\u0649/g, '\u06CC'); // ی
    text = text.replace(/\u064A/g, '\u06CC'); // ی
    return text;;
}

function standardPhoneNum(phone_num) {
    return phone_num?.toString().length < 11 ? "0" + phone_num : phone_num;
  }
  
  function standardNatNum(nat_num) {
    return nat_num
  }

module.exports = {
    standardNatNum,
    standardPhoneNum,
    textIsNumeric,
    replaceArabicCharacters,
}