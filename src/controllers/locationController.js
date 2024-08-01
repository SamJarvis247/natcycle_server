const Location = require('../models/locationModel')

// add new location
exports.addLocation = async (req, res) => {
  const { name, address, latitude, longitude, state, city, country, googleResults } = req.body

  try {
    const location = new Location({
      name,
      address,
      city,
      latitude,
      longitude,
      state,
      country,
      metadata: googleResults,
      user: req.user._id
    })

    await location.save()

    res.status(201).json({
      message: 'Location added successfully',
      data: location
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// get all locations
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({
      user: req.user._id,
      hidden: false
    }).sort({ createdAt: -1 })

    res.status(200).json({
      data: locations,
      message: 'Locations fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// get location by id
exports.getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)

    if (!location) {
      return res.status(404).json({ message: 'Location not found' })
    }

    res.status(200).json({
      data: location,
      message: 'Location fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// update location
exports.updateLocation = async (req, res) => {
  const { name, address, latitude, longitude, state } = req.body

  try {
    const location = await Location.findById(req.params.id)

    if (!location) {
      return res.status(404).json({ message: 'Location not found' })
    }

    if (location.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    location.name = name
    location.address = address
    location.latitude = latitude || location.latitude
    location.longitude = longitude || location.longitude
    location.state = state

    await location.save()

    res.status(200).json({
      data: location,
      message: 'Location updated successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// delete location
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)

    if (!location) {
      return res.status(404).json({ message: 'Location not found' })
    }

    // await location.remove()
    // set location as hidden
    location.hidden = true
    await location.save()

    res.status(200).json({ message: 'Location deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
