//all the db models in our system
const ThingsMatchUser = require("../models/thingsMatch/user.model.js");
const User = require("../models/userModel.js");
const AnalyticsModel = require("./analyticsModel.js");
const endpoints = require("./endpoints.js");
console.log("🚀 ~ endpoints:", endpoints)

const types = ["find", "findOne", "findById", "paginate", "countDocuments", "aggregate"];
const models = [ThingsMatchUser, User];
const whereValueTypes = ["id", "_id", "natcycleId", "firstName", "lastName", "email", "profilePicture", "phoneNumber"];

//function
async function runAnalytics({ model, type, populate, fieldToPopulate, populateFields, whereValue, whereValueType }) {
  //check if were in production
  if (process.env.NODE_ENV === 'production') {
    console.log("Skipping analytics in production environment");
    return;
  }

  // Validate inputs
  if (!models.includes(model) || !types.includes(type)) {
    throw new Error("Invalid model or type for analytics");
  }
  // If populate is true, ensure fieldToPopulate and populateFields are provided
  if (populate && (!fieldToPopulate || !populateFields)) {
    throw new Error("Field to populate and populate fields are required when populate is true");
  }
  // If populate is true, ensure fieldToPopulate is a valid field in the model
  if (populate && !model.schema.paths[fieldToPopulate]) {
    throw new Error(`Field to populate "${fieldToPopulate}" does not exist in model "${model.collection.modelName}"`);
  }
  // If populate is true, ensure populateFields is an array of valid fields
  if (populate && !Array.isArray(populateFields)) {
    throw new Error("Populate fields must be an array");
  }


  // If populate is true, ensure fieldToPopulate is not a virtual field
  if (populate && model.schema.virtuals[fieldToPopulate]) {
    throw new Error(`Field to populate "${fieldToPopulate}" is a virtual field and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a discriminator key
  if (populate && model.schema.discriminators && model.schema.discriminators[fieldToPopulate]) {
    throw new Error(`Field to populate "${fieldToPopulate}" is a discriminator key and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a subdocument
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Array") {
    throw new Error(`Field to populate "${fieldToPopulate}" is an array and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a nested field
  if (populate && fieldToPopulate.includes(".")) {
    throw new Error(`Field to populate "${fieldToPopulate}" cannot be a nested field`);
  }
  // If populate is true, ensure fieldToPopulate is not a mixed type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Mixed") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a mixed type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a map type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Map") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a map type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a buffer type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Buffer") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a buffer type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a date type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Date") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a date type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a number type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Number") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a number type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a string type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "String") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a string type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a boolean type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Boolean") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a boolean type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a decimal type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Decimal128") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a decimal type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a symbol type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Symbol") {
    throw new Error(`Field to populate "${fieldToPopulate}" is a symbol type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a object type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Object") {
    throw new Error(`Field to populate "${fieldToPopulate}" is an object type and cannot be populated`);
  }
  // If populate is true, ensure fieldToPopulate is not a array type
  if (populate && model.schema.paths[fieldToPopulate] && model.schema.paths[fieldToPopulate].instance === "Array") {
    throw new Error(`Field to populate "${fieldToPopulate}" is an array type and cannot be populated`);
  }

  //Build the query statement based on entries(model, type, populate, fieldToPopulate, populateFields, whereValue)
  let query;
  let filter = whereValue || {};
  let filterString = JSON.stringify(filter);
  let queryString = `${model.collection.modelName}`;

  // Build the query based on the type
  switch (type) {
    case 'find':
      query = model.find(filter);
      queryString += `.find(${filterString})`;
      break;
    case 'findOne':
      query = model.findOne(filter);
      queryString += `.findOne(${filterString})`;
      break;
    case 'findById':
      // Use whereValue._id if provided, else placeholder
      const id = (filter && filter._id) ? filter._id : 'placeholder-id';
      query = model.findById(id);
      queryString += `.findById('${id}')`;
      break;
    case 'paginate':
      query = model.paginate(filter);
      queryString += `.paginate(${filterString})`;
      break;
    case 'countDocuments':
      query = model.countDocuments(filter);
      queryString += `.countDocuments(${filterString})`;
      break;
    case 'aggregate':
      query = model.aggregate([]);
      queryString += `.aggregate([])`;
      break;
    default:
      throw new Error(`Unsupported query type: ${type}`);
  }

  // Handle populate directly for aggregate which doesn't support the populate method
  if (populate && type === 'aggregate') {
    // Add a $lookup stage for aggregate
    query.pipeline.push({
      $lookup: {
        from: model.db.models[model.schema.paths[fieldToPopulate].options.ref].collection.name,
        localField: fieldToPopulate,
        foreignField: '_id',
        as: fieldToPopulate
      }
    });

    // Add lookup to query string
    queryString += `.lookup({
      from: '${model.db.models[model.schema.paths[fieldToPopulate].options.ref].collection.name}',
      localField: '${fieldToPopulate}',
      foreignField: '_id',
      as: '${fieldToPopulate}'
    })`;

    // Project only the requested fields
    if (populateFields.length > 0) {
      const project = {};
      populateFields.forEach(field => {
        project[`${fieldToPopulate}.${field}`] = 1;
      });
      query.pipeline.push({ $project: project });
      queryString += `.project(${JSON.stringify(project)})`;
    }
  }

  // Add populate if requested
  if (populate && query.populate) {
    query = query.populate(fieldToPopulate, populateFields.join(' '));
    queryString += `.populate('${fieldToPopulate}', '${populateFields.join(' ')}')`;
  }

  // Execute the query and return results
  const results = await query.explain("executionStats");

  // Check for the last analytics entry with the same query string
  const lastEntry = await AnalyticsModel.findOne({ query: queryString }).sort({ createdAt: -1 });

  if (!lastEntry || (Date.now() - new Date(lastEntry.createdAt).getTime()) > 14 * 24 * 60 * 60 * 1000) {
    // More than 14 days ago or no entry, create new
    const analyticsData = {
      type,
      model: model.collection.modelName,
      query: queryString,
      executionTime: results.executionStats.executionTimeMillis,
      indexUsed: results.executionStats.executionStages.stage === "COLLSCAN" ? false : true,
      executionStats: results.executionStats,
    };
    await AnalyticsModel.create(analyticsData);
  } else {
    // Less than 14 days ago, update existing
    lastEntry.executionTime = results.executionStats.executionTimeMillis;
    lastEntry.indexUsed = results.executionStats.executionStages.stage === "COLLSCAN" ? false : true;
    lastEntry.executionStats = results.executionStats;
    await lastEntry.save();
  }


}

module.exports = runAnalytics;
