const { default: axios } = require("axios");
const config = require("config");
const { readRequestDetails } = require("../../services/data");


async function SendNotifocationWithAPI(message, users) {
    const axios = require('axios');

    const config = {
        method: 'post',
        url: 'https://im.irisaco.com/_matrix/client/r0/service/send_message',
        headers: {
            'Authorization': 'Bearer MDAxY2xvY2F0aW9uIGltLmlyaXNhY28uY29tCjAwMTNpZGVudGlmaWVyIGtleQowMDEwY2lkIGdlbiA9IDEKMDAyNmNpZCB1c2VyX2lkID0gQG5hdjppbS5pcmlzYWNvLmNvbQowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IFQzO3VzLXJXTWtqNm5VZkUKMDAyZnNpZ25hdHVyZSB0DBR5pJKepbnMmSuHsoDVhwvchJfhgRJvayaoG_thIAo',
            'Content-Type': 'application/json'
        },
        data: {
            users: ["193025"],
            message: "درخواست سفر شما رد شد"
        },
        timeout: 10000 // Set timeout to 10 seconds
    };

    axios(config)
        .then(response => {
            console.log('Response:', response.data);
        })
        .catch(error => {
            console.error('Error:', error.response ? error.response.data : error.message);
        });


    // try {
    //     const result = await axios.post(
    //         config.get("MY_IRISA_URL"),
    //         {
    //             users: [request.submitted_by.details.personel_code],
    //             message: message,
    //         },
    //         {
    //             headers: {
    //                 Authorization: "Bearer " + config.get("MY_IRISA_TOKEN"),
    //             },
    //         }
    //     );
    //     console.log("my irisa notif sent", result.data);
    // } catch (error) {
    //     console.log(error);
    //     console.log("my irisa sending error");
    // }

}
async function notifyAPIDeleteApproveRequest(requestID, status) {
    const request = await readRequestDetails(requestID)
    //[rqst?.manager?.emp_num]
    let users = [request.submitted_by.details.personel_code]
    let message = status === 'confirm' ? 'درخواست سفر شما تایید شد' : 'درخواست سفر شما رد شد'
    await SendNotifocationWithAPI(message, users)
}

async function notifyAPIStartTripByDriver(requestID) {
    const request = await readRequestDetails(requestID)
    let users = [request.submitted_by.details.personel_code]
    let message = 'راننده سفر را شروع کرد'
    await SendNotifocationWithAPI(message, users)
}

async function notifyAPIArriveToSource(requestID) {
    const request = await readRequestDetails(requestID)
    let users = [request.submitted_by.details.personel_code]
    let message = 'راننده به مبدا رسید'
    await SendNotifocationWithAPI(message, users)
}


async function notifyAPIArriveToDestination(requestID) {
    const request = await readRequestDetails(requestID)
    let users = [request.submitted_by.details.personel_code]
    let message = 'سفر به پایان رسید'
    await SendNotifocationWithAPI(message, users)
}


async function notifyAPIChangeTimeOfTripByDispature(requestID) {
    const request = await readRequestDetails(requestID)
    let users = [request.submitted_by.details.personel_code]
    let message = 'زمان سفر توسط دیسپاچر تغییر کرد'
    await SendNotifocationWithAPI(message, users)
}


module.exports.notifyAPIArriveToDestination = notifyAPIArriveToDestination
module.exports.notifyAPIArriveToSource = notifyAPIArriveToSource
module.exports.notifyAPIChangeTimeOfTripByDispature = notifyAPIChangeTimeOfTripByDispature
module.exports.notifyAPIDeleteApproveRequest = notifyAPIDeleteApproveRequest
module.exports.notifyAPIStartTripByDriver = notifyAPIStartTripByDriver

