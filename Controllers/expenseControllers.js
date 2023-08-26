const expenses = require("../models/expenseSchema");
const moment = require("moment");
const csv = require("fast-csv");
const fs = require("fs");
const BASE_URL = process.env.BASE_URL;

exports.expenseadd = async (req, res) => {
    const { expense_label, cost, notes, date, category, user_id } = req.body;
    if (!expense_label || !cost || !date || !category || !user_id) {
        res.status(401).json("Mandatory Inputs are required!!");
    }
    try {

        const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")

        const expenseData = new expenses({
            expense_label, cost, notes, date, category, user_id, datecreated
        });
        await expenseData.save();
        res.status(200).json(expenseData);

    } catch (error) {
        res.status(401).json(error);
        console.log("catch block error");
    }
}

exports.generatereport = async (req, res) => {
    const { month, year, user_id } = req.body;
    if (!month || !year || !user_id) {
        res.status(401).json("Mandatory Inputs are required!!");
    }
    try {
        const regx = '-' + month + '-' + year;
        const query = {

            date: { '$regex': regx },

            // expense_label: { $regex: search, $options: "i" },
            // category: { $regex: search, $options: "i" },
            user_id: user_id

        }
        // console.log(query);
        const expenselist = await expenses.find(query);
        res.status(200).json({ expenselist });

    } catch (error) {
        res.status(401).json(error);
        console.log("catch block error" + error);
    }
}

exports.fetchexpenselist = async (req, res) => {
    // const { id } = req.params;
    const id = req.query.id;
    const page = req.query.page || 1;
    const search = req.query.search || "";
    const ITEM_PER_PAGE = 4;


    const query = {
        "$or": [
            { expense_label: { '$regex': search, '$options': 'i' } },
            { category: { '$regex': search, '$options': 'i' } },
            { notes: { '$regex': search, '$options': 'i' } }
        ],
        // expense_label: { $regex: search, $options: "i" },
        // category: { $regex: search, $options: "i" },
        user_id: id
    }
    // console.log(query);
    try {
        const count = await expenses.countDocuments(query);
        const skip = (page - 1) * ITEM_PER_PAGE;
        const expenselist = await expenses.find(query).limit(ITEM_PER_PAGE)
            .skip(skip);
        const pageCount = Math.ceil(count / ITEM_PER_PAGE);
        res.status(200).json({
            Pagination: {
                count, pageCount
            },
            expenselist
        })
        // res.status(200).json(expenselist);
    } catch (error) {
        res.status(401).json(error);
        console.log(error + "catch block error");
    }
}

exports.expensedelete = async (req, res) => {
    const { id } = req.params;
    try {
        const deleteexpense = await expenses.findByIdAndDelete({ _id: id });
        res.status(200).json(deleteexpense);
    } catch (error) {
        res.status(401).json(error);
    }
}

exports.singleexpenseget = async (req, res) => {
    const { id } = req.params;
    try {
        const singleexpensedata = await expenses.findOne({ _id: id });
        res.status(200).json(singleexpensedata)
    } catch (error) {
        res.status(401).json(error)
    }
}

exports.getexpensecategorywise = async (req, res) => {
    const { id } = req.params;

    try {
        const singleexpensedata = await expenses.aggregate([
            {
                $match: { user_id: id }
            },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: 1 }
                }
            }
        ]
        );
        // console.log(singleexpensedata);
        res.status(200).json(singleexpensedata)
    } catch (error) {
        console.log(error);
        res.status(401).json(error)
    }
}

exports.editexpense = async (req, res) => {
    const { id } = req.params;
    const { expense_label, cost, notes, date, category } = req.body;

    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");

    try {
        const updateexpense = await expenses.findByIdAndUpdate({ _id: id }, {
            expense_label, cost, notes, date, category, dateUpdated
        }, {
            new: true
        });
        await updateexpense.save();
        res.status(200).json(updateexpense);
    } catch (error) {
        res.status(401).json(error);
    }
}

exports.userexpenseexport = async (req, res) => {
    try {
        const expensesdata = await expenses.find();

        const csvStream = csv.format({ headers: true });
        // console.log("errorrr");
        if (!fs.existsSync("public/files/export")) {
            if (!fs.existsSync("public/files")) {
                fs.mkdirSync("public/files/");
            }
            if (!fs.existsSync("public/files/export")) {
                fs.mkdirSync("public/files/export");
            }
        }
        // console.log("errorrr");
        const writablestream = fs.createWriteStream(
            "public/files/export/expenses.csv"
        )

        csvStream.pipe(writablestream);


        writablestream.on("finish", function () {
            res.json({
                downloadUrl: `${BASE_URL}/files/export/expenses.csv`
            })
        });

        if (expensesdata.length > 0) {
            expensesdata.map((exp) => {
                csvStream.write({
                    Expense: exp.expense_label ? exp.expense_label : "-",
                    Category: exp.category ? exp.category : "-",
                    Cost: exp.cost ? exp.cost : "-",
                    Notes: exp.notes ? exp.notes : "-",
                    Date: exp.date ? exp.date : "-",
                    DateCreated: exp.datecreated ? exp.datecreated : "-",
                    DateUpdated: exp.dateUpdated ? exp.dateUpdated : "-",
                })
            })
        }

        csvStream.end();
        writablestream.end();

    } catch (error) {
        res.status(401).json(error);
    }
}