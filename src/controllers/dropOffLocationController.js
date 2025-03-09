const DropOffLocation = require('../models/dropOffLocationModel')

// add new drop off location
exports.addDropOffLocation = async (req, res) => {
  const { name, itemType, description, address, latitude, longitude, googleMapsUri, googleMapId } = req.body

  try {
    const existingDropOffLocation = await DropOffLocation.findOne({ name })

    if (existingDropOffLocation) {
      return res.status(400).json({ message: 'Drop off location already exists' })
    }

    const dropOffLocation = new DropOffLocation({
      name,
      itemType,
      description,
      address,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      googleMapsUri,
      googleMapId
    })

    await dropOffLocation.save()

    res.status(201).json({
      message: 'Drop off location added successfully',
      data: dropOffLocation
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// get all drop off locations
exports.getDropOffLocations = async (req, res) => {
  const { page = 1, limit = 10, id, itemType } = req.query

  try {
    const query = {}

    if (itemType) {
      query.itemType = itemType
    }

    if (id) {
      query._id = id
    }

    const dropOffLocations = await DropOffLocation.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 }
    })

    res.status(200).json({
      data: dropOffLocations,
      message: 'Drop off locations fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// get drop off location by id
exports.getDropOffLocationById = async (req, res) => {
  const { id } = req.params

  try {
    const dropOffLocation = await DropOffLocation.findById(id)

    if (!dropOffLocation) {
      return res.status(404).json({ message: 'Drop off location not found' })
    }

    res.status(200).json({
      data: dropOffLocation,
      message: 'Drop off location fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// get nearest drop off locations
exports.getNearestDropOffLocations = async (req, res) => {
  const { latitude, longitude, distance = 10000, itemType } = req.query

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' })
  }

  const query = {}

  if (itemType) {
    query.itemType = itemType
  }

  try {
    if (parseInt(distance) === 0) {
      const dropOffLocations = await DropOffLocation.find(query)

      return res.status(200).json({
        data: dropOffLocations,
        message: 'All drop off locations fetched successfully'
      })
    }

    const dropOffLocations = await DropOffLocation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: distance
        }
      }
    })

    res.status(200).json({
      data: dropOffLocations,
      message: 'Nearest drop off locations fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// delete drop off location
exports.deleteDropOffLocation = async (req, res) => {
  const { id } = req.params

  try {
    const dropOffLocation = await DropOffLocation.findByIdAndDelete(id)

    if (!dropOffLocation) {
      return res.status(404).json({ message: 'Drop off location not found' })
    }

    res.status(200).json({
      message: 'Drop off location deleted successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// update drop off location
exports.updateDropOffLocation = async (req, res) => {
  const { id } = req.params
  const { name, itemType, description, address, latitude, longitude, googleMapsUri, googleMapId } = req.body

  try {
    const dropOffLocation = await DropOffLocation.findById(id)

    if (!dropOffLocation) {
      return res.status(404).json({ message: 'Drop off location not found' })
    }

    dropOffLocation.itemType = itemType || dropOffLocation.itemType
    dropOffLocation.name = name || dropOffLocation.name
    dropOffLocation.description = description || dropOffLocation.description
    dropOffLocation.address = address || dropOffLocation.address
    dropOffLocation.location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }
    dropOffLocation.googleMapsUri = googleMapsUri || dropOffLocation.googleMapsUri
    dropOffLocation.googleMapId = googleMapId || dropOffLocation.googleMapId

    await dropOffLocation.save()

    res.status(200).json({
      message: 'Drop off location updated successfully',
      data: dropOffLocation
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
