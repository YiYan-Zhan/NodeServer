import express, { Application, Request, Response } from "express";
import cors from "cors";
import Crawler from "./API/Crawler";

const app: Application = express();
const port = 5000;

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/crawler", Crawler);

app.get("/", async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).send({
        message: "後端",
    });
});

try {
    app.listen(port, (): void => {
        console.log(`Connected successfully on port ${port}`);
    });
} catch (error) {
    console.error(`Error occured: ${error}`);
}
