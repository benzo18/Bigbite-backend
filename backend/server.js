import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config.js'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import orderModel from "./models/orderModel.js"



//app config
const app = express()
const port = process.env.PORT || 4000;

//middleware
app.use(express.json())
app.use(cors())

//db connection
connectDB();

//api endpoint
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)



app.get("/", (req, res) => {
  res.send("API Working")
})
app.get("/yoco-webhook", (req, res) => {
  res.status(200).send("Webhook received!");
  
});

// Yoco webhook endpoint
app.post("/yoco-webhook", async (req, res) => {
    try {
        console.log(req.body);

        const eventType = req.body.type;
        const eventData = req.body.payload;

        // Extract success and cancel URLs from eventData
        const successUrl = eventData.metadata.success_url;
        const cancelUrl = eventData.metadata.cancel_url;

        let payload;

        if (eventType === "payment.succeeded") {
            const orderId = eventData.metadata.orderId;

            const order = await orderModel.findById(orderId);

            if (order) {
                const eventId = `evt_${uuidv4()}`;
                const paymentId = `p_${uuidv4()}`;

                payload = {
                    id: eventId,
                    type: "payment.succeeded",
                    createdDate: order.date.toISOString(),
                    payload: {
                        id: paymentId,
                        type: "payment",
                        createdDate: order.date.toISOString(),
                        amount: order.amount * 100,
                        currency: "ZAR",
                        paymentMethodDetails: {
                            type: "card",
                            card: {
                                expiryMonth: 11,
                                expiryYear: 2025,
                                maskedCard: "************4242",
                                scheme: "visa",
                            },
                        },
                        status: "succeeded",
                        mode: "test",
                        metadata: {
                            checkoutId: eventData.metadata.checkoutId,
                        },
                    },
                };

                const stringifiedPayload = JSON.stringify(payload);
                const computedSignature = crypto
                    .createHmac("sha256", process.env.YOCO_WEBHOOK_SECRET)
                    .update(stringifiedPayload)
                    .digest("hex");

                console.log("Generated Payload:", payload);
                console.log("Computed Signature:", computedSignature);

                // --- Start processing payment.succeeded ---
                if (eventType === "payment.succeeded") {
                    const orderId = eventData.metadata.orderId;

                    const order = await orderModel.findById(orderId);

                    if (order) {
                        order.payment = true;
                        order.paidAt = Date.now();
                        await order.save();

                        console.log(`Order ${orderId} updated to paid.`);

                        // Redirect to success URL after successful payment
                        res.redirect(302, successUrl);
                    } else {
                        console.error(`Order ${orderId} not found.`);
                    }
                } else if (eventType === "payment.failed") {
                    const orderId = eventData.metadata.orderId;

                    const order = await orderModel.findById(orderId);

                    if (order) {
                        order.payment = false;
                        order.failedAt = Date.now();
                        await order.save();

                        console.log(`Order ${orderId} updated to failed.`);

                        // Redirect to cancel URL after failed payment
                        res.redirect(302, cancelUrl);
                    } else {
                        console.error(`Order ${orderId} updated to failed.`);
                    }
                } else {
                    console.log("Unhandled Yoco webhook event:", eventType);
                }
                // --- End processing payment.succeeded ---

                res.status(200).send();
            } else {
                console.error(`Order ${orderId} not found.`);
                res.status(404).send("Order not found");
            }
        } else {
            console.log("Unhandled Yoco webhook event:", eventType);
            res.status(200).send(); // Still send a 200 OK for other events
        }
    } catch (error) {
        console.error("Error processing Yoco webhook:", error);
        res.status(500).send("Error processing webhook");
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

