module.exports = async function ({ username, nat_num, password, full_name }) {
  const details = {
    nat_num,
  };
  return { details, username : username.toLowerCase(), password, full_name };
};
