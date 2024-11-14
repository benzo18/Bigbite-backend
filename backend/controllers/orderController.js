import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import axios from "axios";
import * as jose from "jose";

const placeOrder = async (req, res) => {
    const frontend_url = process.env.FRONTEND_URL;

    try {
        // 1. Verify the JWT token
        const token = req.headers.authorization.split(" ")[1];
        const { payload } = await jose.jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET)
        );

        // 2. Access the userId from the decoded payload
        const userId = payload.userId;

        // 3. Fetch the user's data from the database
        const user = await userModel.findById(userId);

        // 4. Log the fetched user object to the console
        console.log("Fetched User:", user);

        // 5. Access the user's cartData
        const cartData = user.cartData;

        // 6. Create the order in your database
        const newOrder = new orderModel({
            userId: userId,
            items: req.body.items,
            amount: req.body.amount,
        });

        // 7. Log the userId received from the frontend
        console.log("Received User ID:", req.body.userId);

        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // 8. Format the order items for Yoco
        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "zar",
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }));

        console.log("Items received:", req.body.items);
        console.log("Line items for Yoco:", line_items);

        // 9. Interact with the Yoco API to create a checkout session
        const response = await axios.post(
            `${process.env.YOCO_BASE_URL}/checkouts`,
            {
                amount: newOrder.amount * 100,
                currency: "ZAR",
                line_items: line_items,
                
                success_url: `${frontend_url}/verify?success=true&orderId=${encodeURIComponent( newOrder._id)}`,
                cancel_url: `${frontend_url}/verify?success=false&orderId=${encodeURIComponent(newOrder._id)}`,

                metadata: {
                    orderId: newOrder._id, // Include the newOrder._id here
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.sk_test}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // 10. Send the redirect URL back to the frontend
        console.log(response.data);
        res.json({ success: true, sessionUrl: response.data.redirectUrl });
    } catch (error) {
        console.error("Error creating Yoco order:", error);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
            switch (error.response.status) {
                case 400:
                    // Handle invalid request parameters
                    break;
                case 401:
                    // Handle authentication errors
                    break;
                case 403:
                    // Handle authorization errors
                    break;
                default:
                    // Handle other unexpected errors
            }
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Error setting up request:", error.message);
        }

        throw error;
    }
};

export { placeOrder };