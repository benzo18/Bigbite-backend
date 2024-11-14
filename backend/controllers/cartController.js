import userModel from "../models/userModel.js"

//add items to user cart
const addToCart = async (req, res) => {
try {
    let userData = await userModel.findById(req.body.userId);
    let cartData = await userData.cartData;
    if(!cartData[req.body.itemId]){
        cartData[req.body.itemId] = 1;
    }else{
        cartData[req.body.itemId] += 1;
    }
    await userModel.findByIdAndUpdate(req.body.userId,{cartData});
    res.status(200).json({message: "Item added to cart"});
} catch (error) {
    console.log(error);
    res.status(500).json({message: "Error adding item to cart"});  
}
}

//remove items from user cart
const removeFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        let cartData = await userData.cartData;
        if(cartData[req.body.itemId] > 0){
            cartData[req.body.itemId] -= 1;
        }
        await userModel.findByIdAndUpdate(req.body.userId,{cartData});
        res.status(200).json({message: "Item removed from cart"}); 
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error removing item from cart"});   
    }
}

//fetch user cart data
const getCart = async (req, res) => {
        try {
            let userData = await userModel.findById(req.body.userId);
            let cartData = await userData.cartData;
            res.status(200).json({cartData});
        } catch (error) {
            console.log(error);
            res.status(500).json({message: "Error fetching cart data"});
        }
}

export{addToCart,removeFromCart,getCart}