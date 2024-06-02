const { replaceArabicCharacters } = require("../utils/stringHelper");

function searchAndReplace(obj){
    if (obj == null) return;
    for(const entry in obj){
        const value = obj[entry];
        if (value != null && (typeof value === 'string' || value instanceof String)){
            obj[entry] = replaceArabicCharacters(obj[entry]);
        }
    }
}

module.exports = () => {
    return async function (req, res, next) {
        searchAndReplace(req.query);
        searchAndReplace(req.body);
        next();
    };
}