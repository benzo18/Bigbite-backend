import mongoose from "mongoose";

export const connectDB = async () => {
    mongoose.set('debug', true);
    await mongoose.connect('mongodb+srv://ubuntu_db_admin:GJa0m8s1fldcnkLJ@bigbite-app-cluster.i01za.mongodb.net/BIGBITE_WEB').then (()=>console.log("DB connected"));
}