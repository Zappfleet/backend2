const { default: axios } = require("axios");
const { OrgDataSource } = require("../../../org-modules/constants/OrgDataSource");

module.exports = async function retrieveUserDetails(params) {
    try {
        const { data } = await axios.get(OrgDataSource.userDetailsUrl, { params, headers: { Authorization: OrgDataSource.accessToken } });
        return data;
    } catch (e) {
        e.message = `External Source Error retrieveUserDetails.${e.message}`
        throw e;
    }
}
