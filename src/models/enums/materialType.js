const { getAllMaterialTypes } = require("./materialTypeHierarchy");

const materialEnum = getAllMaterialTypes();

module.exports = materialEnum;
