const https = require("https");
const crypto = require("crypto");
const axios = require("axios");

async function GetAllCoctCenter() {
    try {
        
        const axiosInstance = axios.create({
            timeout: 30000,
            httpsAgent: new https.Agent({
                secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
            }),
        });

        const response = await axiosInstance.get(
            "https://frame.irisaco.com/api/sql2cs/do/oa_costcenter/rest/v1.0",
            {
                headers: {
                    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJNMVo0TFRVNUhwRVN4RzdzeXExbjI5eXdWWHBmMWgyMSIsImV4cCI6MTcxOTkxOTY4NX0.Hq0g0vZffCf-7iDCodVDTbgXxJ8k4bI78O4Nc_OXMM4",
                },
            }
        );

        return response?.data

    }
    catch {
        return null
    }
}

module.exports.GetAllCoctCenter = GetAllCoctCenter;
