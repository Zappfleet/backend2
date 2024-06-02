
const { ConnectDatabase, DropDatabase } = require("../../utils-test");
const { default: mongoose } = require("mongoose");
const { createRegion, updateRegion } = require("../data");
const Region = require("../data/region-model");

beforeAll(async () => {
    await ConnectDatabase("regions");
});

beforeEach(async () => {
    await Region.deleteMany({});
})

afterAll(async () => {
    await DropDatabase();
});


it("should update a region", async () => {
    const result = await createRegion({
        name: createRegionName(),
        geometry: { type: "Polygon", coordinates: SAMPLE_COORDINATES },
        properties: {}
    });
    expect(result.error).not.toBeTruthy();

    const { region } = result;

    const NEW_NAME = "New Name";

    const { region: updatedRegion } = await updateRegion(region._id, { name: NEW_NAME, geometry: { type: "Polygon", coordinates: SAMPLE_COORDINATES } });

    expect(updatedRegion.name).toBe(NEW_NAME);

    if (!result.error) await region.delete();
})

it("should detect region overlap", async () => {
    const result = await createRegion({
        name: createRegionName(),
        geometry: { type: "Polygon", coordinates: SAMPLE_COORDINATES },
        properties: {}
    });
    expect(result.error).not.toBeTruthy();

    const result2 = await createRegion({
        name: createRegionName(),
        geometry: { type: "Polygon", coordinates: SAMPLE_COORDINATES },
        properties: {}
    });
    expect(result2.error).toBe("overlapping areas");

    if (!result.error) await result.region.delete();
    if (!result2.error) await result2.region.delete();
})

it("should create a region", async () => {
    const result = await createRegion({
        name: createRegionName(),
        geometry: { type: "Polygon", coordinates: SAMPLE_COORDINATES },
        properties: { test: 1, test2: 2, }
    });
    expect(result.error).not.toBeTruthy();
    if (!result.error) await result.region.delete();
});


function createRegionName() {
    return "region name " + new Date().getTime();
}

const SAMPLE_COORDINATES = [
    [
        [52.507059, 29.592448],
        [52.527059, 29.592448],
        [52.547059, 29.592448],
        [52.547059, 29.602448],
        [52.547059, 29.612448],
        [52.527059, 29.612448],
        [52.507059, 29.612448],
        [52.507059, 29.602448],
    ]
]

