const { makeKeyFromText } = require("../../utils");
const {
  listVehicles,
  findVehicleById,
  getListOfAssignableDrivers,
  assignDriver,
  createVehicle,
  updateVehicleById,
  unassignVehicleDriver,
  insertVehicleSerivceGroup,
  insertVehicleGroup,
  updateVehicleServiceGroupByKey,
  updateVehicleGroupByKey,
  updateVehicleColorByKey,
  insertVehicleColor,
  getVehicleGroupsAndServices,
  insertVehicleName,
  updateVehicleNameByKey,
  createAgency,
  updateAgency,
  listAgencies,
} = require("../data");

class VehicleController {
  async getListOfAgencies(req, res) {
    const filter = req.query;
    const listOfAgencies = await listAgencies(filter, undefined, undefined);
    res.status(200).send(listOfAgencies);
  }
  async getListOfVehicles(req, res) {
    // const filter = req.query;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const listOfVehicles = await listVehicles(
      filter,
      req.query?.sort,
      req.query?.page,
      true
    );
    res.status(200).send(listOfVehicles);
  }

  async getVehicleDetails(req, res) {
    const id = req.params.id;
    const details = await findVehicleById(id);
    if (details != null) {
      return res.status(200).send(details);
    } else {
      return res.status(404).send({ error: "Vehicle not found" });
    }
  }

  async getAssignableDrivers(req, res) {
    res.status(200).send({ docs: await getListOfAssignableDrivers() });
  }

  async assignDriver(req, res) {
    const method = req.params.method;
    const { vehicle_id, user_id } = req.body;

    const result = await (async function () {
      if (method == "assign") {
        return await assignDriver(vehicle_id, user_id);
      } else if (method == "unassign") {
        return await unassignVehicleDriver(vehicle_id);
      }
    })();

    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
    }
  }

  async insertAgency(req, res) {
    const { agency_name, agency_phone } = req.body;
    const result = await createAgency(agency_name, agency_phone);
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
    }
  }

  async editAgency(req, res) {
    const _id = req.params.id;
    const { agency_name, agency_phone } = req.body;
    const result = await updateAgency(_id, agency_name, agency_phone);
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
    }
  }

  async createVehicle(req, res) {
    const { group, driver_user, plaque, services, extra, gps_uid } = req.body;
    const result = await createVehicle(
      group,
      driver_user,
      plaque,
      services,
      extra,
      null,
      gps_uid
    );
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
    }
  }

  async updateVehicle(req, res) {
    const _id = req.params.id;
    const { group, driver_user, plaque, services, extra, gps_uid } = req.body;
    const result = await updateVehicleById(
      _id,
      group,
      driver_user,
      plaque,
      services,
      extra,
      gps_uid
    );
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
    }
  }

  async createVehicleGroup(req, res) {
    const { name } = req.body;
    const vehicleGroup = await insertVehicleGroup(name);
    if (vehicleGroup.error) {
      res.status(vehicleGroup.status).send({ error: vehicleGroup.error });
    } else {
      res.status(200).send(vehicleGroup);
    }
  }

  async updateVehicleGroup(req, res) {
    const { key } = req.params;
    const vehicleGroup = await updateVehicleGroupByKey(key, req.body);
    if (vehicleGroup.error) {
      res.status(vehicleGroup.status).send({ error: vehicleGroup.error });
    } else {
      res.status(200).send(vehicleGroup);
    }
  }

  async createVehicleColor(req, res) {
    const { name } = req.body;
    const vehicleColor = await insertVehicleColor(name);
    if (vehicleColor.error) {
      res.status(vehicleColor.status).send({ error: vehicleColor.error });
    } else {
      res.status(200).send(vehicleColor);
    }
  }

  async getVehicleData(req, res) {
    const { include_inactive } = req.query;
    res
      .status(200)
      .send(await getVehicleGroupsAndServices(include_inactive == "true"));
  }

  async createVehicleServiceGroup(req, res) {
    const { name, unit } = req.body;
    const vehicleGroup = await insertVehicleSerivceGroup(name, unit);
    if (vehicleGroup.error) {
      res.status(vehicleGroup.status).send({ error: vehicleGroup.error });
    } else {
      res.status(200).send(vehicleGroup);
    }
  }

  async updateVehicleServiceGroup(req, res) {
    const { key } = req.params;
    const vehicleServiceGroup = await updateVehicleServiceGroupByKey(
      key,
      req.body
    );
    if (vehicleServiceGroup.error) {
      res
        .status(vehicleServiceGroup.status)
        .send({ error: vehicleServiceGroup.error });
    } else {
      res.status(200).send(vehicleServiceGroup);
    }
  }

  async createVehicleName(req, res) {
    const { name } = req.body;
    const vehicleName = await insertVehicleName(name);
    if (vehicleName.error) {
      res.status(vehicleName.status).send({ error: vehicleName.error });
    } else {
      res.status(200).send(vehicleName);
    }
  }

  async updateVehicleName(req, res) {
    const { key } = req.params;
    const vehicleName = await updateVehicleNameByKey(key, req.body);
    if (vehicleName.error) {
      res.status(vehicleName.status).send({ error: vehicleName.error });
    } else {
      res.status(200).send(vehicleName);
    }
  }

  async updateVehicleColor(req, res) {
    const { key } = req.params;
    const vehicleColor = await updateVehicleColorByKey(key, req.body);
    if (vehicleColor.error) {
      res.status(vehicleColor.status).send({ error: vehicleColor.error });
    } else {
      res.status(200).send(vehicleColor);
    }
  }
}

module.exports = new VehicleController();
