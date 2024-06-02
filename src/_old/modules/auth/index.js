const auth = require("../../middleware/auth");
const { can } = require("../../middleware/can");
const { globalBruteforce, userBruteforce } = require("../../startup/brute");
const { signupAuth } = require("./middleware");
const {
  signupStepOneValidator,
  signupStepTwoValidator,
  signinvalidator,
} = require("./schema_Validatior");
const { signin, signupStepOne, signupStepTwo } = require("./service");

module.exports = {
  configure(app) {
    app.post("/auth/signup/step1", signupStepOneValidator, signupStepOne);
    app.post(
      "/auth/signup/step2",
      signupAuth,
      signupStepTwoValidator,
      signupStepTwo
    );
    app.post(
      "/auth/signin",
      // globalBruteforce.prevent,
      // userBruteforce.getMiddleware({
      //   key: function (req, res, next) {
      //     // prevent too many attempts for the same username
      //     next(req.body.username);
      //   },
      // }),
      signinvalidator,
      signin
    );
  },
};
