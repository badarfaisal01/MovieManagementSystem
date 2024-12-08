const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
    name: String,
    country:String,
    gender:String,
    age:Number,
    biography: String,
    
    photos: [{type: Buffer}]
});


const Person = mongoose.model('Person', PersonSchema);
module.exports = Person;
