
const materialTypeHierarchy = {
  // Primary type: plastic
  plastic: {
    label: "Plastic",
    subtypes: [
      { value: "500ml plastic", label: "500ml Plastic Bottles" },
      { value: "1000ml plastic", label: "1000ml Plastic Bottles" },
      { value: "1500ml plastic", label: "1500ml Plastic Bottles" },
      { value: "plastic bags", label: "Plastic Bags" },
      { value: "plastic containers", label: "Plastic Containers" },
    ],
  },
  // Primary type: organic
  organic: {
    label: "Organic",
    subtypes: [
      { value: "food waste", label: "Food Waste" },
      { value: "garden waste", label: "Garden Waste" },
    ],
  },
  // Primary type: fabric
  fabric: {
    label: "Fabric",
    subtypes: [
      { value: "clothing", label: "Clothing" },
      { value: "textiles", label: "Textiles" },
    ],
  },
  // Primary type: glass
  glass: {
    label: "Glass",
    subtypes: [
      { value: "glass bottles", label: "Glass Bottles" },
      { value: "glass jars", label: "Glass Jars" },
    ],
  },
  // Primary type: paper
  paper: {
    label: "Paper",
    subtypes: [
      { value: "cardboard", label: "Cardboard" },
      { value: "newspaper", label: "Newspaper" },
      { value: "office paper", label: "Office Paper" },
    ],
  },
  // Primary type: metal
  metal: {
    label: "Metal",
    subtypes: [
      { value: "aluminum cans", label: "Aluminum Cans" },
      { value: "metal containers", label: "Metal Containers" },
      { value: "scrap metal", label: "Scrap Metal" },
    ],
  },
  // Primary type: eWaste
  ewaste: {
    label: "Electronic Waste",
    subtypes: [
      { value: "batteries", label: "Batteries" },
      { value: "small electronics", label: "Small Electronics" },
      { value: "large electronics", label: "Large Electronics" },
    ],
  },
  aluminium: {
    label: "Aluminum",
    subtypes: [
      { value: "aluminum cans", label: "Aluminum Cans" },
      { value: "aluminum containers", label: "Aluminum Containers" },
    ],
  },
};

// Generate a flat list of all material types (primary and subtypes)
const getAllMaterialTypes = () => {
  const allTypes = [];

  // Add primary types
  Object.keys(materialTypeHierarchy).forEach((primaryType) => {
    allTypes.push(primaryType);

    // Add subtypes
    materialTypeHierarchy[primaryType].subtypes.forEach((subtype) => {
      allTypes.push(subtype.value);
    });
  });

  return allTypes;
};

// Generate a list of just primary material types
const getPrimaryMaterialTypes = () => {
  return Object.keys(materialTypeHierarchy);
};

// Get subtypes for a specific primary type
const getSubtypesForPrimaryType = (primaryType) => {
  if (materialTypeHierarchy[primaryType]) {
    return materialTypeHierarchy[primaryType].subtypes.map(
      (subtype) => subtype.value
    );
  }
  return [];
};

// Check if a type is a primary type
const isPrimaryType = (type) => {
  return Object.keys(materialTypeHierarchy).includes(type);
};

// Get the primary type for a subtype
const getPrimaryTypeForSubtype = (subtype) => {
  for (const [primaryType, data] of Object.entries(materialTypeHierarchy)) {
    if (data.subtypes.some((sub) => sub.value === subtype)) {
      return primaryType;
    }
  }
  return null; // Not found
};

// Get the label for any material type (primary or subtype)
const getLabelForMaterialType = (type) => {
  // If it's a primary type, return its label
  if (materialTypeHierarchy[type]) {
    return materialTypeHierarchy[type].label;
  }

  // If it's a subtype, find its label
  for (const data of Object.values(materialTypeHierarchy)) {
    const subtype = data.subtypes.find((sub) => sub.value === type);
    if (subtype) {
      return subtype.label;
    }
  }

  return type; // Fallback to the type itself
};

module.exports = {
  materialTypeHierarchy,
  getAllMaterialTypes,
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
  isPrimaryType,
  getPrimaryTypeForSubtype,
  getLabelForMaterialType,
};
