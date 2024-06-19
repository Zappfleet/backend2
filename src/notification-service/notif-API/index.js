const axios = require('axios');
const config = require("config");
const { ServiceRequest } = require('../../services/data/service-request-model');
const { UserAccount } = require('../../users/data/models/user-model');



async function SendNotifocationWithAPI(message, users) {

    console.log(111, message, users)

    // const config = {
    //     method: 'post',
    //     url: 'https://im.irisaco.com/_matrix/client/r0/service/send_message',
    //     headers: {
    //         'Authorization': 'Bearer MDAxY2xvY2F0aW9uIGltLmlyaXNhY28uY29tCjAwMTNpZGVudGlmaWVyIGtleQowMDEwY2lkIGdlbiA9IDEKMDAyNmNpZCB1c2VyX2lkID0gQG5hdjppbS5pcmlzYWNvLmNvbQowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IFQzO3VzLXJXTWtqNm5VZkUKMDAyZnNpZ25hdHVyZSB0DBR5pJKepbnMmSuHsoDVhwvchJfhgRJvayaoG_thIAo',
    //         'Content-Type': 'application/json'
    //     },
    //     data: {
    //         users: users,
    //         message: message
    //     },
    //     timeout: 10000 // Set timeout to 10 seconds
    // }

    // axios(config)
    //     .then(response => {
    //         console.log("my irisa notif sent", result.data);
    //     })
    //     .catch(error => {
    //         //console.log(error);
    //         console.log("my irisa sending error");
    //     });


    try {
        const result = await axios.post(
            config.get("MY_IRISA_URL"),
            {
                users: users,
                message: message,
            },
            {
                headers: {
                    Authorization: "Bearer " + config.get("MY_IRISA_TOKEN"),
                },
            }
        );
        console.log("my irisa notif sent", result.data);
    } catch (error) {
        console.log(error);
        console.log("my irisa sending error");
    }
}

async function notifyAPIDeleteApproveRequest(requestID, status) {
    let request = await ServiceRequest.findById(requestID)
    let personal_code = await UserAccount.findById(request.submitted_by)
    let users = [personal_code.details.personel_code]
    let message = status === 'confirm' ? 'درخواست سفر شما تایید شد' : 'درخواست سفر شما رد شد'
    await SendNotifocationWithAPI(message, users)
}

async function notifyAPIStartTripByDriver(requestID) {
    let request = await ServiceRequest.findById(requestID)
    let personal_code = await UserAccount.findById(request.submitted_by)
    let users = [personal_code.details.personel_code]
    let message = '- note راننده سفر را شروع کرد'
    await SendNotifocationWithAPI(message, users)
}

async function notifyAPIArriveToSource(requestID) {
    let request = await ServiceRequest.findById(requestID)
    let personal_code = await UserAccount.findById(request.submitted_by)
    let users = [personal_code.details.personel_code]
    let message = 'راننده به مبدا رسید'
    await SendNotifocationWithAPI(message, users)
}


async function notifyAPIArriveToDestination(requestID) {

    let request = await ServiceRequest.findById(requestID)
    let personal_code = await UserAccount.findById(request.submitted_by)
    let users = [personal_code.details.personel_code]
    let message = 'سفر به پایان رسید'
    await SendNotifocationWithAPI(message, users)

}


async function notifyAPIChangeTimeOfTripByDispature(requestID) {
    let request = await ServiceRequest.findById(requestID)
    let personal_code = await UserAccount.findById(request.submitted_by)
    let users = [personal_code.details.personel_code]
    let message = 'زمان سفر توسط دیسپاچر تغییر کرد'
    await SendNotifocationWithAPI(message, users)
}


module.exports.notifyAPIArriveToDestination = notifyAPIArriveToDestination
module.exports.notifyAPIArriveToSource = notifyAPIArriveToSource
module.exports.notifyAPIChangeTimeOfTripByDispature = notifyAPIChangeTimeOfTripByDispature
module.exports.notifyAPIDeleteApproveRequest = notifyAPIDeleteApproveRequest
module.exports.notifyAPIStartTripByDriver = notifyAPIStartTripByDriver

