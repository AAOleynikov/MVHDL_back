import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import * as path from "path";
import { ValidationResult, validateProject, Project, simulate } from "./svhdl";
import * as fs from "fs";
import { chdir } from "process";
import { exec } from "child_process";
import cors from "cors";

exec(`rm -r run/*`);
chdir("run");

dotenv.config();

const app: Express = express();
var port = process.env.PORT;
if (port === undefined) {
  console.log("running default port");
  port = "3000";
}
app.use(express.json());
app.use(cors());

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
  const body: Project = req.body.data;
  validateProject(body)
    .then((result) => {
      res.contentType("application/json");
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Server side error");
    });
});

app.post("/simulate", checkContentType, (req: Request, res: Response) => {
  req.accepts("application/json");
  const body: Project = req.body.data;
  simulate(body)
    .then((result) => {
      res.contentType("application/json");
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Server side error");
    });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
