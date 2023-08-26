const express = require("express");
const router = new express.Router();
const controllers = require("../Controllers/usersControllers");
const expensecontrollers = require("../Controllers/expenseControllers");
const expensecategory = require("../Controllers/categoryControllers")
const upload = require("../multerconfig/storageConfig");
const { requireSignIn } = require("../middlewares/authMiddleware");

// routes

router.post("/user/register", upload.single("user_profile"), controllers.userpost);
router.post("/user/resetpwd", controllers.userresetpwd);
router.post("/user/sendemailbe", controllers.usersendemail);
router.post("/category/add", expensecategory.categoryadd);
router.post("/expensereportgenerate", expensecontrollers.generatereport);
router.get("/fetchexpensecatlist/:id", expensecategory.fetchexpensecatlist);
router.post("/expense/add", expensecontrollers.expenseadd);
router.get("/fetchexpenselist", expensecontrollers.fetchexpenselist);
router.delete("/expensecategory/delete/:id", expensecategory.categorydelete);
router.delete("/expense/delete/:id", expensecontrollers.expensedelete);
router.get("/singleexpensecategory/:id", expensecategory.singleexpensecategory);
router.get("/singleexpense/:id", expensecontrollers.singleexpenseget);
router.get("/getexpensecategorywise/:id", expensecontrollers.getexpensecategorywise);
router.put("/editexpensecategory/:id", expensecategory.editexpensecategory);
router.put("/editexpense/:id", expensecontrollers.editexpense);
router.post("/user/login", controllers.userlogin);
router.post("/sendpasswordresetlink", controllers.sendpasswordresetlink);
router.get("/user/details", controllers.userget);
router.get("/user/:id", controllers.singleuserget);
router.put("/user/edit/:id", upload.single("user_profile"), controllers.useredit);
router.delete("/user/delete/:id", controllers.userdelete);
router.put("/user/statusupdate/:id", controllers.changestatus);
router.get("/userexport", controllers.userExport);
router.get("/userexpenseexport", expensecontrollers.userexpenseexport);

module.exports = router;