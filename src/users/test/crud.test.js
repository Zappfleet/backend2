const { default: mongoose } = require("mongoose");
const { ConnectDatabase, DropDatabase } = require("../../utils-test");
const { UserRole } = require("../data/models/role-model");
const { createUserRole, editUserRole, listUserRoles, deactivateUserRole, reactivateUserRole } = require("../data/role");
const { UserAccount } = require("../data/models/user-model");

beforeAll(async () => {
    await ConnectDatabase("services");
    await clearDatabase();

});

beforeEach(async () => {
    await clearDatabase();
})

afterEach(async () => {
    await clearDatabase();
})

afterAll(async () => {
    await DropDatabase();
});

async function clearDatabase() {
    await UserRole.deleteMany({});
    await UserAccount.deleteMany({});
}

test("create user role", async () => {
    const title = "test-permissin";
    const P1 = "p1", P2 = "p2";

    const userRole = await createUserRole(title, [P1, P2]);
    expect(userRole.title).toBe(title);
    expect(userRole.permissions.includes(P1) && userRole.permissions.includes(P2)).toBe(true)
    await userRole.delete();
});


test("edit user role", async () => {

    await UserRole.deleteMany({});

    const title = "test-permissin";
    const new_title = "new-title";
    const P1 = "p1", P2 = "p2", P3 = "p3";
    const userRole = await createUserRole(title, [P1, P2]);

    let editedUserRole;

    editedUserRole = await editUserRole(userRole._id, new_title, null);
    expect(editedUserRole.title).toBe(new_title);
    expect(editedUserRole.permissions.includes(P1) && userRole.permissions.includes(P2)).toBe(true)

    editedUserRole = await editUserRole(userRole._id, null, [P3]);
    expect(editedUserRole.title).toBe(new_title);
    expect(editedUserRole.permissions.includes(P1)).toBe(false)
    expect(editedUserRole.permissions.includes(P2)).toBe(false)
    expect(editedUserRole.permissions.includes(P3)).toBe(true)

    await userRole.delete();
});

test("list of user roles - filterd", async () => {
    const role_1 = await createUserRole("title 1", []);
    const role_2 = await createUserRole("title 2", []);
    const role_3 = await createUserRole("title 3", []);

    let roles;

    roles = await listUserRoles();
    expect(roles.length).toBe(3);

    roles = await listUserRoles({ _id: { $in: [role_1._id, role_3._id] } });
    expect(roles.length).toBe(2);
})

test("list of user roles", async () => {
    await UserRole.deleteMany({});

    let roles;
    roles = await listUserRoles();

    expect(roles.length).toBe(0);

    await createUserRole("title 1", ["p"]);
    await createUserRole("duplicate_title", ["p"]);
    const role = await createUserRole("duplicate_title", ["p"]);

    roles = await listUserRoles();
    expect(roles.length).toBe(2);

    await deactivateUserRole(role._id)

    roles = await listUserRoles();
    expect(roles.length).toBe(1);


    await reactivateUserRole(role._id)

    roles = await listUserRoles();
    expect(roles.length).toBe(2);

})

test("auto assign rules", async () => {
    const title = "test-permissin";
    const assign_rule_1 = {
        key: "field1",
        value: "true",
    }
    const assign_rule_2 = {
        key: "field2",
        value: "23",
    }
    const userRole = await createUserRole(title, [], [assign_rule_1, assign_rule_2]);

    let sampleUser;
    let pass;
    sampleUser = {
        details: { field1: true, field2: 23, }
    }
    pass = await userRole.userPassAutoAssignRule(sampleUser);
    expect(pass).toBe(true);

    sampleUser = {
        details: { field1: true, field2: 88, }
    }
    pass = await userRole.userPassAutoAssignRule(sampleUser);
    expect(pass).toBe(false);

})