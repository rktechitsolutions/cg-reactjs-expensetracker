const expense_category = require("../models/expensecategorySchema");
const moment = require("moment");
const BASE_URL = process.env.BASE_URL;

exports.categoryadd = async (req, res) => {
    const { name, user_id } = req.body;
    if (!name || !user_id) {
        res.status(401).json("Mandatory Inputs are required!!");
    }
    try {

        const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")

        const expensecategoryData = new expense_category({
            name, user_id, datecreated
        });
        await expensecategoryData.save();
        res.status(200).json(expensecategoryData);

    } catch (error) {
        res.status(401).json(error);
        console.log("catch block error" + error);
    }
}

exports.fetchexpensecatlist = async (req, res) => {
    const { id } = req.params;
    try {
        const singleexpensedata = await expense_category.find({ user_id: id });
        // console.log(singleexpensedata);
        res.status(200).json({
            singleexpensedata
        })
        // res.status(200).json(singleexpensedata)
    } catch (error) {
        res.status(401).json(error)
    }
}

exports.singleexpensecategory = async (req, res) => {
    const { id } = req.params;
    try {
        const singleexpensedata = await expense_category.findOne({ _id: id });
        res.status(200).json(singleexpensedata)
    } catch (error) {
        res.status(401).json(error)
    }
}

exports.categorydelete = async (req, res) => {
    const { id } = req.params;
    try {
        const deleteexpense = await expense_category.findByIdAndDelete({ _id: id });
        res.status(200).json(deleteexpense);
    } catch (error) {
        res.status(401).json(error);
    }
}

exports.editexpensecategory = async (req, res) => {
    const { id } = req.params;
    const { name, user_id } = req.body;

    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");

    try {
        const updateexpense = await expense_category.findByIdAndUpdate({ _id: id }, {
            name, user_id, dateUpdated
        }, {
            new: true
        });
        await updateexpense.save();
        res.status(200).json(updateexpense);
    } catch (error) {
        res.status(401).json(error);
    }
}