const mongoose = require("mongoose");

const expensecategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    user_id: {
        type: String,
        required: true
    },
    datecreated: Date,
    dateUpdated: Date
});

// model

const expense_category = new mongoose.model("expense_category", expensecategorySchema);

module.exports = expense_category;