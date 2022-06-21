const mongoose = require("mongoose")
const Schema = mongoose.Schema


const Song = new Schema({
  uploadedBy: {
    type: Schema.Types.ObjectId,
    default: '',
  },
  title: {
    type: String,
    default: "",
  },
  artist: {
    type: String,
    default: "",
  },
  year: {
    type: String,
    default: "",
  },
  albumArt: {
    type: String,
    default: "",
  },
  src: {
    type: String,
    default: "",
  },
})


module.exports = mongoose.model("Song", Song)