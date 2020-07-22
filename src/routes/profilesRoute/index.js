const express = require("express");
const ProfileSchema = require("../../models/ProfileSchema");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const router = express.Router();
const upload = multer();

const profilesDirectory = join(__dirname, "../../public/profiles");

const profilesRouter = express.Router()

profilesRouter.get("/", async (req, res, next) => {
    try {

        const query = q2m(req.query)
        const profiles = await ProfileSchema.find(query.criteria, query.options.fields)
            .skip(query.options.skip)
            .limit(query.options.limit)
            .sort(query.options.sort)

        res.send({
            data: profiles,
            total: profiles.length,
        })
    } catch (error) {
        next(error)
    }
})

profilesRouter.get("/:username", async (req, res, next) => {
    try {
        const username = req.params.username
        const profile = await ProfileSchema.findById(username)
        res.send(profile)
    } catch (error) {
        console.log(error)
        next("While reading profiles list a problem occurred!")
    }
})

profilesRouter.post("/", async (req, res, next) => {
    try {
        console.log(req.body)
        const user = basicAuth(req);

        const newProfile = await new ProfileSchema({ ...req.body, username: user.name })
        const { _id } = await newProfile.save()

        res.status(201).send(newProfile)
    } catch (error) {
        next(error)
    }
})

profilesRouter.put("/:username", async (req, res, next) => {
    try {
        const profile = await ProfileSchema.findByIdAndUpdate(
            req.params.username,
            {
                ...req.body,
            },
            { runValidators: true }
        )
        if (profile) {
            res.send("Ok")
        } else {
            const error = new Error(`Profile with username ${req.params.username} not found`)
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
        next(error)
    }
})

profilesRouter.delete("/:username", async (req, res, next) => {
    try {
        await ProfileSchema.findByIdAndDelete(req.params.username)

        res.send("Deleted")
    } catch (error) {
        next(error)
    }
})


router.route("/:profileId").post(upload.single("post"), async (req, res) => {
    try {
        const profile = await ProfileSchema.findById(req.params.profileId);
        const user = basicAuth(req);
        if (profile) {
            if (profile.username === user.name) {
                const [filename, extension] = req.file.mimetype.split("/");
                await fs.writeFile(
                    join(profilesDirectory, `${req.params.profileId}.${extension}`),
                    req.file.buffer
                );

                let url = `${req.protocol}://${req.host}${
                    process.env.ENVIRONMENT === "dev" ? ":" + process.env.PORT : ""
                    }/static/profiles/${req.params.profileId}.${extension}`;
                await ProfileSchema.findByIdAndUpdate(req.params.profileId, {

                    image: url,
                    username: user.name,
                });
                res.status(200).send("ok");
            } else {
                res.status(403).send("unauthorised");
            }
        } else {
            res.status(404).send("not found");
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("bad request");
    }
});

module.exports = profilesRouter