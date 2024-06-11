import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true
    },
    maxStorageCapacity: {
        type: Number,
        required: function() {
            return this.role === 'miller'; // Required only if the role is 'miller'
        }
    }
},
{
    timestamps: true //when data will enter it will mention
}
);

export const User = mongoose.model('User', userSchema, 'user');