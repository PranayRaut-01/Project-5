const mongoose = require('mongoose')


const isValidDetails = (requestBody) => Object.keys(requestBody).length > 0;

const isValidValue = (value) => {
    if (typeof value === "undefined" || value === null)
        return false;
    if (typeof value === "string" && value.trim().length === 0)
        return false;
    return true;
};

const isValidName = function(value){
    return /^[A-Za-z\s]+$/.test(value)
};

const isValidEmail = (email)=>{
    return (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))
}

const isValidPhone = (phone)=>{
    return (/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone))
}

const isValidPincode = function (value) {
    if (!isNaN(value) && value.toString().length == 6) return true
}

const isValidObjectId = (objectId) => mongoose.Types.ObjectId.isValid(objectId)

module.exports = { isValidValue, isValidDetails,isValidName,isValidEmail,isValidPhone, isValidPincode,isValidObjectId }