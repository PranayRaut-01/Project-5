const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");
const validator = require("../validations/validator");

const createOrder=async (req,res)=>{
    try{
    const userId= req.params.userId
    if (!validator.isValidObjectId(userId))
    return res.status(400).send({ status: false, message: `${userId} is NOT a valid userID` });

    const findUser = await userModel.findById(userId) 
    if(!findUser) return res.status(404).send({ status: false, message: "No User With this Id" })

    if(req.userId!=userId)
        return res.status(403).send({ status: false, message: "Unauthorised Access" })

    if (!validator.isValidDetails(req.body)) {
        return res.status(400).send({ status: false, message: "please provide order details" })
    }
    const {cartId, cancellable,status}= req.body

    if (!validator.isValidValue(cartId))
    return res.status(400).send({ status: false, message: "Please provide valid cartId" });

    if (!validator.isValidObjectId(cartId))
    return res.status(400).send({ status: false, message: `${cartId} is NOT a valid cartID` });

    if(cancellable){
        if (!validator.isValidValue(cancellable))
            return res.status(400).send({ status: false, message: "Please provide valid cancellable value" });
        if([true,false].indexOf(cancellable)==-1)
            return res.status(400).send({ status: false, message: "Please provide true or false as cancellable value" });
    }

    if(status){
        if (!validator.isValidValue(status))
            return res.status(400).send({ status: false, message: "Please provide status value" });
        if(['pending', 'completed', 'cancelled'].indexOf(status)==-1)
            return res.status(400).send({ status: false, message: "Please provide valid status" });
    }
  
    const findCart =  await cartModel.findOne({_id: cartId, isDeleted: false}).select({_id:0, createdAt:0,updatedAt:0})

    if(!findCart)
        return res.status(404).send({ status: false, message:"cart doesn't exists"})

    const {items,totalPrice,totalItems}= findCart

    if(totalPrice==0)
       return res.status(400).send({ status: false, message:"cart is empty"})

    let totalQuantity =0
    for(let i =0;i<items.length;i++){
       totalQuantity += items[i].quantity
    }

    const data ={userId,items,totalPrice,totalItems,totalQuantity, cancellable,status}
    
    const createdOrder = await orderModel.create(data)
    return res.status(201).send({status:true,message:"Success",data:createdOrder})
  
  } catch (error) {
    return res.status(500).send({status:false,message:error.message})
}}
  

const updateOrder= async (req,res)=>{
    try {
        const userId= req.params.userId
        if (!validator.isValidObjectId(userId))
        return res.status(400).send({ status: false, message: `${userId} is NOT a valid userID` });

        const findUser = await userModel.findById(userId) 
        if(!findUser) return res.status(404).send({ status: false, message: "No User With this Id" })
    
        if(req.userId!=userId)
            return res.status(403).send({ status: false, message: "Unauthorised Access" })

        if (!validator.isValidDetails(req.body)) {
            return res.status(400).send({ status: false, message: "please provide order details" })
        }

        const {orderId,status} = req.body

        if (!validator.isValidObjectId(orderId))
        return res.status(400).send({ status: false, message: `${orderId} is NOT a valid orderID` });

        const findOrder = await orderModel.findOne({_id:orderId,isDeleted:false}) 
        if(!findOrder) return res.status(404).send({ status: false, message: "No order With this Id" })

        if(req.userId!=findOrder.userId)
            return res.status(403).send({ status: false, message: "Unauthorised Access" })

        if(['pending', 'completed', 'cancelled'].indexOf(status)==-1)
            return res.status(400).send({ status: false, message: "Please Provide Correct Status" })


        if (findOrder.cancellable==false && status=="cancelled")
            return res.status(400).send({ status: false, message: "This order is not cancellable" })

        if(findOrder.status=="completed")
            return res.status(400).send({ status: false, message: "This order is already completed" })

        if(findOrder.status=="cancelled")
            return res.status(400).send({ status: false, message: "This order is already cancelled" })

        if(status=="pending")
            return res.status(400).send({ status: false, message: "Order is already in pending state" })    

        const updatedOrder= await orderModel.findByIdAndUpdate(orderId,{$set:{status:status}},{new:true})
        return res.status(200).send({status:true,message:"Success",data:updatedOrder})
       
    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}

module.exports.createOrder=createOrder
module.exports.updateOrder=updateOrder
