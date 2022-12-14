import dbConnect from "../../../lib/mongodb";
import User from "../../../models/userModel";

const bcrypt = require("bcryptjs");

export default async function handler(req, res) {
    const { method } = req;
    await dbConnect();
    switch (method) {
        case "POST":
            try {
                const user = await User.findOne({
                    username: req.body.username,
                });
                if (!user) {
                    res.status(404).send({ success: false, error: "username" });
                } else {
                    const match = await bcrypt.compare(
                        req.body.password,
                        user.password
                    );
                    if (match)
                        res.status(200).send({ success: true, user: user });
                    else
                        res.status(403).send({
                            success: false,
                            error: "password",
                        });
                }
            } catch (error) {
                res.status(400).end();
            }
            break;
        default:
            res.status(400).end();
            break;
    }
}
