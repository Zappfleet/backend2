
const { Restriction } = require("../../_old/modules/restriction/restriction.model");
const { Systeminactive } = require("../model/inactivesystem");



async function insert_InactiveSystem(req, res) {
    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        const item = req.body;
        const systemInactive = new Systeminactive(item)
        console.log(7000, req.body, item, systemInactive);
        const result = await systemInactive.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function insertRestrictionShowRequests(req, res) {
    try {
        const { count, key } = req.body;
        let item = {
            key: key,
            value: count
        };

        // Check if the entry with the given key exists
        const existingRestriction = await Restriction.findOne({ key: item.key });

        if (existingRestriction) {
            // If it exists, update the value
            existingRestriction.value = item.value;
            existingRestriction.updatedAt = new Date();
            await existingRestriction.save();
            console.log('Updated existing restriction:', existingRestriction);
        } else {
            // If it does not exist, create a new entry
            const newRestriction = new Restriction(item);
            await newRestriction.save();
            console.log('Created new restriction:', newRestriction);
        }

        return res.status(200).send({
            status: 200,
            data: item
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}
async function selectRestrictionShowRequests(req, res) {
    const { count, key } = req.query;
    try {
        console.log(10);
        const result = await Restriction.find({ key: key })
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}


////////////
async function insertSetWorkingWeek(req, res) {
    console.log(52);
    try {
        console.log(200);
        const { item, key } = req.body;
        let ite = {
            key: key,
            value: item
        };

        // Check if the entry with the given key exists
        const existingRestriction = await Restriction.findOne({ key: ite.key });

        if (existingRestriction) {
            // If it exists, update the value
            existingRestriction.value = ite.value;
            existingRestriction.updatedAt = new Date();
            await existingRestriction.save();
            console.log('Updated existing restriction:', existingRestriction);
        } else {
            // If it does not exist, create a new entry
            const newRestriction = new Restriction(ite);
            await newRestriction.save();
            console.log('Created new restriction:', newRestriction);
        }

        return res.status(200).send({
            status: 200,
            data: ite
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}
async function selectSetWorkingWeek(req, res) {
    const {key } = req.query;
    try {
        console.log(10);
        const result = await Restriction.find({ key: key })
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}
/////////////////
async function select_InactiveSystem(req, res) {
    console.log(900);
    try {
        console.log(10);
        const result = await Systeminactive.find({})
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_InactiveSystem(req, res) {
    try {
        //console.log(700, req.params.id);
        const result = await Systeminactive.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_InactiveSystem(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await Systeminactive.findByIdAndUpdate(id, item, { new: true });
        //   console.log(800, result);

        console.log(900, item, id);
        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

module.exports = {
    insert_InactiveSystem,
    select_InactiveSystem,
    delete_InactiveSystem,
    update_InactiveSystem,
    insertRestrictionShowRequests,
    selectRestrictionShowRequests,
    insertSetWorkingWeek,
    selectSetWorkingWeek,
};


