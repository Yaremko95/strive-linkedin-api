const express = require("express");
const ExperienceSchema = require("./../../models/ExperienceSchema")
const experienceRouter = express.Router()




experienceRouter.get("/", async (req, res, next) => {
    try {
        const experience = await ExperienceSchema.find(req.query)
        res.send(experience)
    } catch (error) {
        next(error)
    }
})




experienceRouter.get("/:id", async (req, res, next) => {
    try {
        const id = req.params.id
        const experience = await ExperienceSchema.findById(id)
        if (experience) {
            res.send(experience)
        } else {
            const error = new Error()
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
        console.log(error)
        next("A problem occurred while reading the experience list!")
    }
})





experienceRouter.post("/",
    async (req, res, next) => {
        try {

            const newExperience = new ExperienceSchema(req.body)
            const { _id } = await newExperience.save()
            res.status(201).send(_id)


        } catch (error) {
            next(error)
        }
    })






experienceRouter.put("/:id", async (req, res, next) => {
    try {
        const experience = await ExperienceSchema.findByIdAndUpdate(req.params.id, req.body)
        console.log(experience)
        if (experience) {
            res.send("Ok")
        } else {
            const error = new Error(`Experience with id: ${req.params.id} was not found`)
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
        next(error)
    }
})





experienceRouter.delete("/:id", async (req, res, next) => {
    try {
        const experience = await ExperienceSchema.findByIdAndDelete(req.params.id)
        if (experience) {
            res.send("Deleted")
        } else {
            const error = new Error(`Experience with id: ${req.params.id} was not found`)
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
        next(error)
    }
})




module.exports = experienceRouter




