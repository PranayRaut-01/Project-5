const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { uploadFile } = require("../aws/aws");
const validator = require("../validations/validator");

////////////////////////////aws////////////////////////////////

const createUser = async function (req, res) {
    try {
        const body = req.body;

        if (!validator.isValidDetails(body))
            return res
                .status(400)
                .send({ status: false, message: "Invalid Request" });

        let { fname, lname, email, phone, password } = body;
        const addressString = req.body.address;

        if (!validator.isValidValue(fname))
            return res
                .status(400)
                .send({ status: false, message: "Please provide First name" });

        if(!validator.isValidName(fname)) 
            return res
                .status(400)
                .send({ status: false, message: "Please provide valid First name" });      

        if (!validator.isValidValue(lname))
            return res
                .status(400)
                .send({ status: false, message: "Please provide Last name" });

        if(!validator.isValidName(lname)) 
            return res
                .status(400)
                .send({ status: false, message: "Please provide valid Last name" });       

        if (!validator.isValidValue(email))
            return res
                .status(400)
                .send({ status: false, message: "Please provide Email" });

        if (!validator.isValidEmail(email)) {
            return res
                .status(400)
                .send({ status: false, message: "Please provide valid Email Address" });
        }

        let isDuplicateEmail = await userModel.findOne({ email });
        if (isDuplicateEmail) {
            return res
                .status(409)
                .send({ status: false, message: "email already exists" });
        }

        if (!validator.isValidValue(password)) {
            return res
                .status(400)
                .send({ status: false, messege: "Please provide password" });
        }

        if (password.length < 8 || password.length > 15) {
            return res
                .status(400)
                .send({ status: false, message: "Password must be of 8-15 letters." });
        }

        if (!validator.isValidValue(phone)) {
            return res
                .status(400)
                .send({ status: false, messege: "Please provide phone number" });
        }

        if (!validator.isValidPhone(phone)) {
            return res
                .status(400)
                .send({ status: false, message: "Please provide valid phone number" });
        }

        let isDuplicatePhone = await userModel.findOne({ phone });
        if (isDuplicatePhone)
            return res
                .status(409)
                .send({ status: false, message: "phone no. already exists" });

        if (!validator.isValidValue(addressString)) {
            return res
                .status(400)
                .send({ status: false, message: "Please provide address" });
        }

        const address = JSON.parse(addressString);

        if (
            !address.shipping ||
            !address.shipping.street ||
            !address.shipping.city ||
            !address.shipping.pincode
        )
            return res
                .status(400)
                .send({
                    status: false,
                    message: "please provide Full shipping address",
                });

        if (
            !address.billing ||
            !address.billing.street ||
            !address.billing.city ||
            !address.billing.pincode
        )
            return res
                .status(400)
                .send({
                    status: false,
                    message: "please provide Full billing address",
                });

        if (!validator.isValidPincode(address.shipping.pincode))
            return res
                .status(400)
                .send({
                    status: false,
                    message: "please provide valid pincode in shipping",
                });

        if (!validator.isValidPincode(address.billing.pincode))
            return res
                .status(400)
                .send({
                    status: false,
                    message: "please provide valid pincode in billing",
                });

        let files = req.files;
        if (!(files && files.length > 0)) {
            return res
                .status(400)
                .send({ status: false, message: "profile image is required" });
        }

        let profileImage = await uploadFile(files[0]);

        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);

        const bodyObject = {
            fname,
            lname,
            email,
            phone,
            password,
            address,
            profileImage,
        };

        const newUser = await userModel.create(bodyObject);
        return res
            .status(201)
            .send({ status: true, message: "Success", data: newUser });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

//API #2 :POST /login
// Allow an user to login with their email and password.
// On a successful login attempt return the userId and a JWT token contatining the userId, exp, iat.

const loginUser = async function(req,res){
    try{
         const loginData = req.body;
         
         const { email,password } = loginData;
  
         if (!validator.isValidDetails(loginData))
         return res.status(400).send({ status: false, message: "Invalid Request" });
         
         if(!validator.isValidValue(email))
         return res.status(400).send({status:false,message:"EmailId is Required"});
  
         if(!validator.isValidEmail(email))
         return res.status(400).send({status:false,message:"Please provide valid Email Address"});
  
         if(!validator.isValidValue(password))
         return res.status(400).send({status:false,message:"Password is Required"});
  

        const userDetail = await userModel.findOne({email});
        if(!userDetail)
            return res.status(401).send({status:false,message:"EmailId is NOT Correct"});
         
         let encryptedPassword = userDetail.password;

         const passwordCheck = await bcrypt.compare(password,encryptedPassword);
  
         if(!passwordCheck)
           return res.status(401).send({status:false,message:"Password is NOT Correct"});
  
         const userId = userDetail._id;
         const token =  jwt.sign({
          userId : userId,
          exp: Math.floor(Date.now()/1000)+24*60*60 // expirydate =24 hours 
         },
         "project5Group42")
  
         return res.status(200).send({status:true,message:"User login successfull",data:{userId,token}})
         
     }
       catch(err){
        return res.status(500).send({status:false,message:err.message})
       }
  }
  

  const getUser=async function(req,res){
    try{
    const userId=req.params.userId;
 
    if(!validator.isValidObjectId(userId)){
     return res.status(400).send({status:false,msg:"UserId is not a valid userId"})
   }
 
   const getUserById=await userModel.findById(userId);
   if(!getUserById){ 
     return res.status(404).send({status:false,msg:"no user exists with this userId"})
    }

    if(userId!=req.userId)
    return res.status(403).send({status: false, message:"Unauthorised Access"})
 
   return res.status(200).send({status:true,message:"user profile details",data:getUserById})
    }
    catch(err){
    return res.status(500).send({status:false,message:err.message})
    }
}

 const updateUser = async function(req,res){
    try{
    const userId = req.params.userId
    if(!validator.isValidObjectId(userId))
       return res.status(400).send(`${userId} is not valid`)
    
    const findId = await userModel.findById(userId) 
    if(!findId)
       return res.status(404).send({ status: false, message: "No User With this Id" })

    if(req.userId!=userId)
       return res.status(403).send({ status: false, message: "Unauthorised Access" })

    const body = req.body
    
    const { fname, lname, email, phone, password } = body;
    const addressString = req.body.address;

    const files = req.files;
    if (files && files.length > 0) {
        const profileImage = await uploadFile(files[0]);
        body.profileImage= profileImage
    }

if(!(body&&files))
    return res.status(400).send({ status: false, message: "Invalid Request" })

if(fname||fname==''){
    if (!validator.isValidValue(fname))
        return res
            .status(400)
            .send({ status: false, message: "Please provide First name" });

    if(!validator.isValidName(fname)) 
        return res
            .status(400)
            .send({ status: false, message: "Please provide valid First name" });  
}    
if(lname||lname==''){
    if (!validator.isValidValue(lname))
        return res
            .status(400)
            .send({ status: false, message: "Please provide Last name" });

    if(!validator.isValidName(lname)) 
        return res
            .status(400)
            .send({ status: false, message: "Please provide valid Last name" });       
}
if(email||email==''){
    if (!validator.isValidValue(email))
        return res
            .status(400)
            .send({ status: false, message: "Please provide Email" });

    if (!validator.isValidEmail(email)) {
        return res
            .status(400)
            .send({ status: false, message: "Please provide valid Email Address" });
    }

    const isDuplicateEmail = await userModel.findOne({ email });
    if (isDuplicateEmail) {
        return res
            .status(409)
            .send({ status: false, message: "email already exists" });
    }
}
if(password||password==''){
    if (!validator.isValidValue(password)) {
        return res
            .status(400)
            .send({ status: false, messege: "Please provide password" });
    }

    if (password.length < 8 || password.length > 15) {
        return res
            .status(400)
            .send({ status: false, message: "Password must be of 8-15 letters." });
    }
    
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
}
if(phone||phone==''){
    if (!validator.isValidValue(phone)) {
        return res
            .status(400)
            .send({ status: false, messege: "Please provide phone number" });
    }

    if (!validator.isValidPhone(phone)) {
        return res
            .status(400)
            .send({ status: false, message: "Please provide valid phone number" });
    }

    const isDuplicatePhone = await userModel.findOne({ phone });
    if (isDuplicatePhone)
        return res
            .status(409)
            .send({ status: false, message: "phone no. already exists" });
}

if(addressString||addressString==''){

        const address = JSON.parse(addressString)  
        body.address=address
        const { shipping, billing } = address

        if (!validator.isValidValue(shipping.street)) {
            return res.status(400).send({ status: false, message: " Enter Street Name" })
        }

        if (!validator.isValidValue(shipping.city)) {
            return res.status(400).send({ status: false, message: " Enter City Name" })
        }

        if (!validator.isValidValue(shipping.pincode)) {
            return res.status(400).send({ status: false, message: " Enter Pincode" })
        }

        if (!validator.isValidPincode(shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Enter Valid Shipping Pincode" })
        }

        if (!validator.isValidValue(billing.street)) {
            return res.status(400).send({ status: false, message: " Enter Street Name" })
        }

        if (!validator.isValidValue(billing.city)) {
            return res.status(400).send({ status: false, message: " Enter City Name" })
        }

        if (!validator.isValidValue(billing.pincode)) {
            return res.status(400).send({ status: false, message: " Enter Pincode" })
        }

        if (!validator.isValidPincode(billing.pincode)) {
            return res.status(400).send({ status: false, message: "Enter Valid billing Pincode" })
        }
}

 
    const updateuser = await userModel.findByIdAndUpdate( userId,{$set:body},{new: true})
    return res.status(200).send({ status: true, message: "Success", data: updateuser })

  }
  catch(err){
    return res.status(500).send({msg:err.message})}
  }


module.exports.createUser = createUser;
module.exports.loginUser = loginUser;
module.exports.getUser = getUser;
module.exports.updateUser = updateUser;