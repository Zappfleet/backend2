// statsController.js
//const { Request } = require('../models/Request'); // Adjust the path to your Request model
//const { getAdministrativeRole } = require('../utils/roles'); // Adjust the path to your role utility function
//const { Types } = require('mongoose');

exports.getRequestStatistics = async function (req, res) {
    res.status(200).send({ info: 'success getRequestStatistics'})
    // const role = getAdministrativeRole(req.user.role)
    // const requests = await Request.aggregate([{
    //     $match: {
    //         ...(!["admin", "superDispatcher"].includes(role) && { [`${role}.account_id`]: Types.ObjectId(req.user._id) })
    //     }
    // }, {
    //     $facet: {
    //         'by_status': [{
    //             $group: {
    //                 _id: "$status",
    //                 total: { $count: {} }
    //             }
    //         }],
    //         "by_area": [{
    //             $lookup: {
    //                 from: 'areas',
    //                 localField: 'area_id',
    //                 foreignField: "_id",
    //                 as: 'area'
    //             }
    //         }, { $unwind: '$area' }, { $group: { _id: '$area._id', name: { $first: '$$CURRENT.area.name' }, total: { $count: {} } } }],
    //         "by_dispatcher": [{
    //             $project: {
    //                 main_dispatcher: { $first: "$dispatcher" }
    //             }
    //         },
    //         {
    //             $group: {
    //                 _id: "$main_dispatcher.account_id", full_name: { $first: '$$CURRENT.main_dispatcher.full_name' }, total: { $count: {} }
    //             },
    //         }],
    //         "by_manager": [{
    //             $group: { _id: '$manager.full_name', total: { $count: {} } }
    //         }],
    //         "by_proj_code": [{
    //             $match: {
    //                 "cost_manager.proj_code": {
    //                     $exists: true,
    //                     $ne: null
    //                 }
    //             }
    //         },
    //         {
    //             $group: { _id: '$cost_manager.proj_code', total: { $count: {} } }
    //         }],
    //         "by_cost_center": [{
    //             $match: {
    //                 "cost_manager.cost_center": {
    //                     $exists: true,
    //                     $ne: null
    //                 }
    //             }
    //         },
    //         {
    //             $group: { _id: '$cost_manager.cost_center', total: { $count: {} } }
    //         }],
    //         "by_date": [{
    //             $group: { _id: { month: { $month: '$for_date' }, year: { $year: '$for_date' } }, total: { $count: {} } }
    //         }],
    //     }
    // }])
    // res.status(200).send({ info: 'success', requests })
}
