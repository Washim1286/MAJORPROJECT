const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

/* ------------------- ✅ Search Route — IMPORTANT: should come before /:id ------------------- */
router.get("/search", wrapAsync(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === "") {
        req.flash("error", "Please enter a search term.");
        return res.redirect("/listings");
    }

    const listings = await Listing.find({
        $or: [
            { location: { $regex: q, $options: "i" } },
            { title: { $regex: q, $options: "i" } }
        ]
    });

    if (listings.length === 0) {
        req.flash("error", `No results found for "${q}"`);
    }

    res.render("listings/index", { listings });
}));

/* ------------------- ✅ Index & Create Listing ------------------- */
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

/* ------------------- ✅ New Listing Form ------------------- */
router.get("/new", isLoggedIn, listingController.renderNewForm);

/* ------------------- ✅ Show, Update, Delete Listing ------------------- */
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

/* ------------------- ✅ Edit Form ------------------- */
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;
