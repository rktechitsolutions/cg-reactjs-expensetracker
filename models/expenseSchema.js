const mongoose = require("mongoose");
const validator = require("validator");

const expenseSchema = new mongoose.Schema({
    expense_label: {
        type: String,
        required: true,
        trim: true
    },
    cost: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    date: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    datecreated: Date,
    dateUpdated: Date
});

// model

const expenses = new mongoose.model("expenses", expenseSchema);

module.exports = expenses;