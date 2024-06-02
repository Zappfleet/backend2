const { listRegions, getRegionDocById, createRegion, updateRegion, disableRegion } = require("../data");

class RegionController {

    async getListOfRegions(req, res) {
        const regions = await listRegions()
        return res.status(200).send({ docs: regions });
    }

    async getRegionById(req, res) {
        const result = await getRegionDocById(req.params.id);
        if (result.region == null) return res.status(404).send({ error: "region id does not exists" });
        return res.status(200).send(result);
    }

    async submitRegion(req, res) {
        const { name, geometry, properties, dispatcher } = req.body;
        const result = await createRegion({ dispatcher, name, geometry, properties });
        res.status(result.status || 200).send(result);
    }

    async editRegion(req, res) {
        const { name, geometry, properties, dispatcher } = req.body;
        const result = await updateRegion(req.params.id, { name, geometry, dispatcher, properties });
        res.status(result.status || 200).send(result);
    }

    async deactivateRegion(req, res) {
        const result = await disableRegion(req.params.id);
        res.status(result.status || 200).send(result);
    }
}


module.exports = new RegionController();