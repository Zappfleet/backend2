const { default: mongoose } = require("mongoose");
const { ConnectDatabase, DropDatabase } = require("../../utils-test");
const { UserRole } = require("../data/models/role-model");
const { UserAccount } = require("../data/models/user-model");
const { createUserRole } = require("../data/role");
const { preSignUpUser, assignOneTimeToken, activatePendingUser, resetUserPasswordWithSecretCode } = require("../data/user");
const { encrypt } = require("../../utils");
const { userStatus } = require("../data/constants/userStatus");

beforeAll(async () => {
    await ConnectDatabase("user-register");
    await clearDatabase();

});

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

test("user activation", async () => {
    const userData = {
        username: "test-110",
        phone: "09100000000",
        password: "351123",
        details: {
            field_1: true,
            field_2: 21,
        }
    }
    const output = await preSignUpUser(userData);

    expect(output.user).not.toBe(undefined);
    expect(output.user.status).toBe(userStatus.PENDING.key);

    await activatePendingUser(output.user.username, output.encrypted_value_original);

    const updatedUser = await UserAccount.findOne({ username: output.user.username });
    expect(updatedUser.status).toBe(userStatus.ACTIVE.key);

});

test('user reset password with wrong secret code', async () => {
    const userData = {
        username: "test-4871",
        phone: "09100000000",
        password: "351123",
    }
    const output = await preSignUpUser(userData);
    const { user } = await activatePendingUser(output.user.username, output.encrypted_value_original);
    expect(encrypt(userData.password)).toBe(user.password);

    const { code: correct_code, user: updatedUser } = await assignOneTimeToken(user.username);

    const new_password = "884571asd";
    const wrong_code = `wrong_${correct_code}`;
    const result = await resetUserPasswordWithSecretCode(user.username, wrong_code, new_password);
    expect(result).not.toBeTruthy();


})

test('user reset password with correct secret code', async () => {
    const userData = {
        username: "test-4871",
        phone: "09100000000",
        password: "351123",
    }
    const output = await preSignUpUser(userData);
    const { user } = await activatePendingUser(output.user.username, output.encrypted_value_original);
    expect(encrypt(userData.password)).toBe(user.password);

    const { code: correct_code, user: updatedUser } = await assignOneTimeToken(user.username);

    const new_password = "884571asd";

    await resetUserPasswordWithSecretCode(user.username, correct_code, new_password);
    const userWithNewPassword = await UserAccount.findOne({ username: user.username });
    expect(encrypt(new_password)).toBe(userWithNewPassword.password);

    const result = await resetUserPasswordWithSecretCode(user.username, correct_code, new_password);
    expect(result).not.toBeTruthy();

})

test("one time token assignment", async () => {

    const userData = {
        username: "test-1954",
        phone: "09100000000",
        password: "351123",
    }
    const output = await preSignUpUser(userData);
    expect(output.user).toBeTruthy();
    expect(output.user.status).toBe(userStatus.PENDING.key);
    await activatePendingUser(output.user.username, output.encrypted_value_original);

    let updatedUser;
    updatedUser = await UserAccount.findOne({ username: output.user.username });
    expect(updatedUser.one_time_token.encrypted_value).not.toBeTruthy();

    const { code } = await assignOneTimeToken(updatedUser.username)
    updatedUser = await UserAccount.findOne({ username: updatedUser.username });
    expect(updatedUser.one_time_token.encrypted_value).toBeTruthy();
    expect(code).toBeTruthy();
})

test("user pre-signup script (basic info and role assignment)", async () => {

    const title_1 = "test-role_1";
    const assign_rule_1 = {
        key: "field_1",
        value: "true",
    }


    const title_2 = "test-role_2";
    const assign_rule_2 = {
        key: "field_2",
        value: "99",
    }

    const role_1 = await createUserRole(title_1, [], [assign_rule_1]);
    const never_used_role = await createUserRole(title_2, [], [assign_rule_2]);

    const userData = {
        username: "test-110",
        phone: "09100000000",
        password: "351123",
        details: {
            field_1: true,
            field_2: 21,
        }
    }

    const output = await preSignUpUser(userData);


    expect(output.user).not.toBe(undefined);
    expect(output.user.roles.length).toBe(1);
    expect(`${output.user.roles[0]}`).toBe(`${role_1._id}`);

    expect(output.user.username).toBe(userData.username);
    expect(output.user.phone).toBe(userData.phone);
    expect(output.user.password).toBe(encrypt(userData.password));
    expect(output.user.status).toBe(userStatus.PENDING.key);

})