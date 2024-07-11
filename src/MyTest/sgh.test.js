const { sum } = require('./sgh');



test("sum two numbers", async () => {
    const result = sum(1, 2)
    expect(result).toBe(3);

});
