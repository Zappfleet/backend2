

const { getListOfCostCenters, getProjCodeInfo, getIrisaPersonelList, getEmployeeCostCenter } = require("../../irisa/lib");

async function Test(req, res) {
    try {
        // const result = await getListOfCostCenters(null)
        //const result = await getProjCodeInfo(1224,null)
      //  const result = await  getIrisaPersonelList()
      const result = await  getEmployeeCostCenter(4001010)
        
        res.status(200).json({
            status: 200,
            data: result,
        });
    } catch (error) {
        res.status(300).json({
            status: 300,
            data: 'error',
        });
    }
}

module.exports = { Test };
