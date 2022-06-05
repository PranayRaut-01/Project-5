const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const validator = require("../validations/validator");

const createCart = async (req, res) => {
    try{
        const userId = req.params.userId
        if (!validator.isValidObjectId(userId))
        return res.status(400).send({ status: false, message: `${userId} is NOT a valid userID` });

        const findUser = await userModel.findById(userId) 
        if(!findUser) return res.status(404).send({ status: false, message: "No User With this Id" })
    
        if(req.userId!=userId)
            return res.status(403).send({ status: false, message: "Unauthorised Access" })

            
        if (!validator.isValidDetails(req.body)) {
            return res.status(400).send({ status: false, message: "please provide product details" })
        }
        let {productId,quantity}   = req.body

        if(!productId)
            return res.status(400).send({ status: false, message: " Please Provide a valid productID" });
        if(!quantity)
            return res.status(400).send({ status: false, message: " Please Provide a valid quantity of product" });    

        if (!validator.isValidObjectId(productId))
            return res.status(400).send({ status: false, message: `${productId} is NOT a valid productID` });
        
        const productDoc = await productModel.findOne({_id:productId,isDeleted:false});

        if(!productDoc)
            return res.status(404).send({status:false,message:"Product Does NOT exists"});
        
        if (isNaN(quantity))
            return res.status(400).send({ status: false, message: "Quantity should be number" });

        if (quantity < 1)
            return res.status(400).send({ status: false, message: "Quantity should be minimum 1" });    
        
        const findCart = await cartModel.findOne({userId}) 

        if(!findCart){
            let data = {userId}
            let items=[{productId,quantity}]

            data["items"]=items
            data.totalPrice=(productDoc.price)*quantity
            data.totalItems=items.length
            const newCart = await cartModel.create(data)
            return res.status(201).send({status:true,message:"Success",data:newCart})
        }

        let { _id, items, totalPrice } = findCart
        
        for (let i = 0; i < items.length; i++) {
            if (productId == items[i].productId) {

                const newPrice = (productDoc.price) * quantity + totalPrice
                items[i].quantity += quantity
                const newObj ={totalPrice:newPrice,items}

                const addToCart = await cartModel.findByIdAndUpdate(_id,newObj, { new: true })
                return res.status(201).send({ status: true, message: "Success", data: addToCart })
            }
        }

        const add= {productId,quantity}
        
        const newPrice = (productDoc.price)*quantity+totalPrice

        const addToCart = await cartModel.findByIdAndUpdate(_id,{$addToSet:{items:add},$set:{totalPrice:newPrice,totalItems:items.length+1}},{new:true})
        return res.status(201).send({status:true,message:"Success",data:addToCart})

    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }
}

const getCart = async(req,res)=>{
    try{
    let userId = req.params.userId
    if (!validator.isValidObjectId(userId))
    return res.status(400).send({ status: false, message: "Please provide the valid userId" });

    const findUser = await userModel.findById( userId)
    if(!findUser) return res.status(404).send({status: false, message:"User does not exists"})

    if(userId!=req.userId)
    return res.status(403).send({status: false, message:"Unauthorised Access"})

    const findCart = await cartModel.findOne({ userId})
    if(!findCart) 
    return res.status(404).send({status: false, message:"cart does not exists"})


    return res.status(200).send({ status: true,message: 'Success',data:findCart})

}
catch(err){
    return res.status(500).send({status: false,message:err.message})}
}


const updateCart = async (req, res) => {
    try{
        const userId = req.params.userId
        const data = req.body
        const {productId, cartId, removeProduct} = data

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" });
        }

        const userByuserId = await userModel.findById(userId);

        if (!userByuserId) {
            return res.status(404).send({ status: false, message: 'user not found.' });
        }
        
        if (req.userId != userId) {
            return res.status(403).send({
              status: false,
              message: "Unauthorized access.",
            });
        }

        if (!validator.isValidValue(productId)) {
            return res.status(400).send({ status: false, messege: "please provide productId" })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is invalid" });
        }

        const findProduct = await productModel.findById(productId);
        
        if (!findProduct) {
            return res.status(404).send({ status: false, message: 'product not found.' });
        }

        if(findProduct.isDeleted == true){
            return res.status(400).send({ status:false, msg: "product is deleted" });
        }

        if (!validator.isValidValue(cartId)) {
            return res.status(400).send({ status: false, messege: "please provide cartId" })
        }

        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is invalid" });
        } 

        const findCart = await cartModel.findById(cartId);
    
        if (!findCart) {
            return res.status(404).send({ status: false, message: 'cart not found.' });
        }

        const findProductInCart = await cartModel.findOne({ items: { $elemMatch: { productId: productId } } });
       
        if (!findProductInCart) {
            return res.status(404).send({ status: false, message: 'product not found in the cart.' });
        }

        if (!validator.isValidValue(removeProduct)) {
            return res.status(400).send({ status: false, messege: "please provide items to delete" })
        }

        if ((isNaN(Number(removeProduct)))) {
            return res.status(400).send({ status: false, message:'removeProduct should be a valid number' })
        }
        
        if ([0,1].indexOf(removeProduct)==-1) {
            return res.status(400).send({ status: false, message: 'removeProduct should be 0 or 1' })
        }
        let findQuantity = findCart.items.find(x => x.productId.toString() === productId)
        
        if (removeProduct == 0) {
            let totalAmount = findCart.totalPrice - (findProduct.price * findQuantity.quantity)
            let quantity = findCart.totalItems - 1
            let newCart = await cartModel.findByIdAndUpdate(
                cartId,
                { $pull: { items: { productId: productId } },
                $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true })

            return res.status(200).send({ status: true,
                message: 'Success', data: newCart })
        }

        if (removeProduct == 1) {
            let newAmount = findCart.totalPrice - findProduct.price;
            let items = findCart.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].productId.toString() === productId) {
                    items[i].quantity = items[i].quantity - 1;
                    if (items[i].quantity == 0) {
                        let noOfItems = findCart.totalItems - 1;
                        let newCart = await cartModel.findByIdAndUpdate(
                             cartId,
                            {
                                $pull: { items: { productId: productId } },
                                $set: { totalPrice: newAmount, totalItems: noOfItems },
                            },
                            { new: true }
                        );
                        return res.status(200).send({
                            status: true,
                            message: "Success",
                            data: newCart,
                        });
                    }
                }
            }

          const data = await cartModel.findOneAndUpdate(
            { _id: cartId },
            { totalPrice: newAmount, items: items },
            { new: true }
          );

          return res.status(200).send({
            status: true,
            message: "product in the cart updated successfully.",
            data: data,
          });
        }
    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }
}

   
const deleteCart = async(req,res)=>{
    let userId = req.params.userId

    if (!validator.isValidObjectId(userId))
    return res.status(400).send({ status: false, message: "Please provide the valid userId" });

    const findUser = await userModel.findById( userId)
    if(!findUser) return res.status(404).send({status: false, message:"User does not exists with given id"})

    if(userId!=req.userId)
    return res.status(403).send({status: false, message:"Unauthorised Access"})

    const findCart = await cartModel.findOne({userId})
    if(!findCart)
    return res.status(404).send({status: false, message:"cart does not exists"})

    if(findCart.totalPrice==0)
    return res.status(400).send({status: false, message:"Cart is empty."})
      
    await cartModel.findOneAndUpdate({userId},{$set:{items:[],totalPrice:0,totalItems:0}})
    return res.status(204).send({status: true, message:"Products in cart deleted successfully"})

}


module.exports.createCart=createCart
module.exports.getCart=getCart
module.exports.updateCart=updateCart
module.exports.deleteCart=deleteCart