mongoose = require 'mongoose'


articleSchema = new mongoose.Schema
  authors: [mongoose.Types.ObjectId]
  body: {type: String, required: true}
  created: {type: Date, required: true}
  updated: {type: Date, required: true}
  taxonomy: {type: [String], required: true}
  subtitle: String
  teaser: String
  title: {type: String, required: true}
  urls: {type: [String], required: true}

module.exports = mongoose.model 'Article', articleSchema
