const users = require("../models/usersSchema");
const moment = require("moment");
const csv = require("fast-csv");
const fs = require("fs");
const { hashPassword, comparePassword } = require("../helpers/authHelper");
const BASE_URL = process.env.BASE_URL;
const JWT = require("jsonwebtoken");
var email = require("emailjs")
// const { SMTPClient } = require("emailjs")

// register user
exports.userpost = async (req, res) => {
    // console.log(req.file);
    const file = req.file.filename;
    const { fname, lname, email, mobile, gender, location, status, password } = req.body;

    if (!fname || !lname || !email || !mobile || !gender || !location || !status || !file || !password) {
        res.status(401).json("All Inputs are required!!");
    }

    try {
        const peruser = await users.findOne({ email: email });

        if (peruser) {
            res.status(401).json("User already exists!!");
        } else {
            const hashedPassword = await hashPassword(password);
            const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")

            const userData = new users({
                fname, lname, email, mobile, gender, location, status, password: hashedPassword, profile: file, datecreated
            });
            await userData.save();
            res.status(200).json(userData);
        }
    } catch (error) {
        res.status(401).json(error);
        console.log("catch block error");
    }
}

exports.userresetpwd = async (req, res) => {
    const { user_id, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");
    try {
        const updateuser = await users.findByIdAndUpdate({ _id: user_id }, {
            password: hashedPassword, dateUpdated
        }, {
            new: true
        });
        await updateuser.save();
        res.status(200).json(updateuser);
    } catch (error) {
        res.status(401).json(error);
    }
}

exports.usersendemail = async (req, res) => {
    const { mail, id, message } = req.body;

    try {
        var server = email.server.connect({
            user: 'reshkhan14@gmail.com',
            password: 'bvtvnjnrnlewtaqk',
            host: 'smtp.gmail.com',
            ssl: true,
        });
        var url = process.env.CLIENT_URL + '/resetpassword/' + id;
        server.send(
            {
                // text: "<html>Passoword Reset Link: <a href='" + url + "'>Click Here </a></html>",
                text: "We received a request to reset your password. If you didn't make this request, simply ignore this email.",
                from: 'Codeguru <reshkhan14@gmail.com>',
                to: 'Reshma <' + mail + '>',
                cc: '',
                subject: 'Password Reset Link CG Expense Tracker',
                attachment:
                    [
                        { data: "<html> <a href='" + url + "'>Click Here</a> </html>", alternative: true }
                    ]
            },
            (err, message) => {
                res.status(200).json(err || message);
                // console.log(err || message);
            }
        );
    } catch (error) {
        res.status(401).json(error);
    }
    // const hashedPassword = await hashPassword(password);
    // const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");
    // try {
    //     const updateuser = await users.findByIdAndUpdate({ _id: user_id }, {
    //         password: hashedPassword, dateUpdated
    //     }, {
    //         new: true
    //     });
    //     await updateuser.save();
    //     res.status(200).json(updateuser);
    // } catch (error) {
    //     res.status(401).json(error);
    // }
}

exports.sendpasswordresetlink = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await users.findOne({ email });
        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'Email is not registered'
            })
        }
        res.status(200).json({
            user
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Error in Forgot Password',
            error
        })
    }
}

exports.userlogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        // validation
        if (!email || !password) {
            return res.status(404).send({
                success: false,
                message: 'invalid email or password'
            })
        }
        // check user exists
        const user = await users.findOne({ email });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'Email is not registered'
            })
        }

        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(200).send({
                success: false,
                message: 'Password incorrect'
            })
        }

        // token
        const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).send({
            success: true,
            message: 'login successfully',
            user: {
                fname: user.fname,
                lname: user.lname,
                email: user.email,
                phone: user.mobile,
                location: user.location,
                user_id: user._id
            },
            token,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in Login',
            error
        })
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

        const skip = (page - 1) * ITEM_PER_PAGE; // 1*4=4

        const count = await users.countDocuments(query);

        const usersdata = await users.find(query)
            .sort({ datecreated: sort == "new" ? -1 : 1 })
            .limit(ITEM_PER_PAGE)
            .skip(skip);

        const pageCount = Math.ceil(count / ITEM_PER_PAGE);

        res.status(200).json({
            Pagination: {
                count, pageCount
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

exports.changestatus = async (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    try {
        const updateuser = await users.findByIdAndUpdate({ _id: id }, {
            status: data
        }, { new: true });
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

exports.userExport = async (req, res) => {
    try {
        const usersdata = await users.find();

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
            "public/files/export/users.csv"
        )

        csvStream.pipe(writablestream);


        writablestream.on("finish", function () {
            res.json({
                downloadUrl: `${BASE_URL}/files/export/users.csv`
            })
        });

        if (usersdata.length > 0) {
            usersdata.map((user) => {
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