import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: [true, 'User ID is required'] },
  items: { type: Array, required: [true, 'Items are required'] },
  amount: { type: Number, required: [true, 'Amount is required'] },
  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false }
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;