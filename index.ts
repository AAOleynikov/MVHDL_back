import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { ValidationResult, validateProject, Project } from "./svhdl";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is working!");
});

function checkContentType(req, res, next) {
  if (req.is("application/json")) {
    next();
  } else {
    res.status(415).send("Unsupported Media Type");
  }
}

app.post("/validate", checkContentType, (req: Request, res: Response) => {
  req.accepts("application/json");
  const body: Project = req.body;
  validateProject(body)
    .then((result) => {
      res.statusCode = 200;
      res.contentType("application/json");
      res.send(result);
    })
    .catch(() => {
      res.statusCode = 500;
      res.send("Server side error");
    });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
