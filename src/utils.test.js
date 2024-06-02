const { encrypt, decrypt } = require("./utils");

test("encryption", async () => {
    const SAMPLE = "this is a sample text";
    const encryptedData = encrypt(SAMPLE);
    const data = encryptedData;
    const output = decrypt(data);
    expect(output).toBe(SAMPLE);
})
