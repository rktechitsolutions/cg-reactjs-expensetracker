const users = require("../models/usersSchema");
const moment = require("moment");
const csv = require("fast-csv");
const fs = require("fs");
const BASE_URL = process.env.BASE_URL

// register user
exports.userpost = async (req, res) => {
    // console.log(req.file);
    // console.log(req.body);
    const file = req.file.filename;
    const { fname, lname, email, mobile, gender, location, status } = req.body;

    if (!fname || !lname || !email || !mobile || !gender || !location || !status || !file) {
        res.status(401).json("All Inputs are required!!");
    }

    try {
        const peruser = await users.findOne({ email: email });

        if (peruser) {
            res.status(401).json("User already exists!!");
        } else {

            const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")

            const userData = new users({
                fname, lname, email, mobile, gender, location, status, profile: file, datecreated
            });
            await userData.save();
            res.status(200).json(userData);
        }
    } catch (error) {
        res.status(401).json(error);
        console.log("catch block error");
    }
}
// get user details - home page
exports.userget = async (req, res) => {
    // req.query as the parameter passed as query parameters not as just params
    const search = req.query.search || "";
    const gender = req.query.gender || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "";
    const page = req.query.page || 1;
    const ITEM_PER_PAGE = 4;


    const query = {
        fname: { $regex: search, $options: "i" }//$options makes search case insensitive
    }
    console.log(req.query);
    if (gender !== "All") {
        query.gender = gender
    }
    if (status !== "All") {
        query.status = status
    }
    try {

        const skip = (page-1) * ITEM_PER_PAGE; // 1*4=4

        const count = await users.countDocuments(query);

        const usersdata = await users.find(query)
            .sort({datecreated:sort == "new" ? -1 : 1})
            .limit(ITEM_PER_PAGE)
            .skip(skip);

        const pageCount = Math.ceil(count/ITEM_PER_PAGE);

        res.status(200).json({
            Pagination:{
                count,pageCount
            },
            usersdata
        })
    } catch (error) {
        res.status(401).json(error)
    }
}

// get single user data
exports.singleuserget = async (req, res) => {
    const { id } = req.params;
    try {
        const singleuserdata = await users.findOne({ _id: id });
        res.status(200).json(singleuserdata)
    } catch (error) {
        res.status(401).json(error)
    }
}

// user edit
exports.useredit = async (req, res) => {
    const { id } = req.params;
    const { fname, lname, email, mobile, gender, location, status, user_profile } = req.body;
    const file = req.file ? req.file.filename : user_profile;

    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");

    try {
        const updateuser = await users.findByIdAndUpdate({ _id: id }, {
            fname, lname, email, mobile, gender, location, status, profile: file, dateUpdated
        }, {
            new: true
        });
        await updateuser.save();
        res.status(200).json(updateuser);
    } catch (error) {
        res.status(401).json(error);
    }
}

// change status

exports.changestatus = async (req,res) => {
    const {id} = req.params;
    const {data} = req.body;
    try {
        const updateuser = await users.findByIdAndUpdate({_id: id}, {
            status: data
        },{new:true});
        await updateuser.save();
        res.status(200).json(updateuser);
    } catch (error) {
        res.status(401).json(error);
    }
}

// userdelete

exports.userdelete = async (req, res) => {
    const { id } = req.params;
    try {
        const deleteuser = await users.findByIdAndDelete({ _id: id });
        res.status(200).json(deleteuser);
    } catch (error) {
        res.status(401).json(error);
    }
}

// export to csv

exports.userExport = async (req,res) => {
    try {
        const usersdata = await users.find();

        const csvStream = csv.format({headers:true});
        // console.log("errorrr");
        if(!fs.existsSync("public/files/export")){
            if(!fs.existsSync("public/files")){
                fs.mkdirSync("public/files/");
            }
            if(!fs.existsSync("public/files/export")){
                fs.mkdirSync("public/files/export");
            }
        }
        // console.log("errorrr");
        const writablestream = fs.createWriteStream(
            "public/files/export/users.csv"
        )

        csvStream.pipe(writablestream);
        

        writablestream.on("finish",function(){
            res.json({
                downloadUrl: `${BASE_URL}/files/export/users.csv`
            })
        });

        if(usersdata.length > 0){
            usersdata.map((user)=>{
                csvStream.write({
                    FirstName: user.fname ? user.fname : "-",
                    LastName: user.lname ? user.lname : "-",
                    Email: user.email ? user.email : "-",
                    Phone: user.mobile ? user.mobile : "-",
                    Gender: user.gender ? user.gender : "-",
                    Status: user.status ? user.status : "-",
                    Profile: user.profile ? user.profile : "-",
                    Location: user.location ? user.location : "-",
                    DateCreated: user.datecreated ? user.datecreated : "-",
                    DateUpdated: user.dateUpdated ? user.dateUpdated : "-",
                })
            })
        }

        csvStream.end();
        writablestream.end();

    } catch (error) {
        res.status(401).json(error);
    }
}