import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

export interface Project {
  files: { fileName: string; fileContent: string }[];
  topLevelEntity: string; // uut_AndGate
  simTimeFs?: number;
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export interface SimulationResult {
  success: boolean;
  vcd: string;
}

var directoryNumber = 0;
function getDirName(): string {
  directoryNumber++;
  const dirName = directoryNumber.toString();
  setTimeout(() => {
    console.log(`rm -r ${dirName}`);
    exec(`rm -r ${dirName}`);
  }, 1000 * 120);

  return directoryNumber.toString();
}

async function executeCommand(
  command: string,
  cwd: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        resolve({ code: error.code || 1, stdout, stderr });
      } else {
        resolve({ code: 0, stdout, stderr });
      }
    });
  });
}

export async function validateProject(
  project: Project
): Promise<ValidationResult> {
  const dirName = getDirName();
  fs.mkdirSync(dirName);

  let hasError = false;
  const errorMessages: string[] = [];

  for (const file of project.files) {
    const filePath = path.join(dirName, file.fileName);
    fs.writeFileSync(filePath, file.fileContent);

    const { code, stderr } = await executeCommand(
      `ghdl -a ${file.fileName}`,
      dirName
    );
    if (code !== 0) {
      hasError = true;
      errorMessages.push(stderr);
    }
  }

  return { success: !hasError, errors: errorMessages };
}

export async function simulate(project: Project): Promise<SimulationResult> {
  const dirName = getDirName();
  fs.mkdirSync(dirName);
  console.log(project)

  for (const file of project.files) {
    const filePath = path.join(dirName, file.fileName);
    fs.writeFileSync(filePath, file.fileContent);

    const { code, stderr } = await executeCommand(
      `ghdl -a ${file.fileName}`,
      dirName
    );
    if (code !== 0) {
      return { success: false, vcd: "" };
    }
  }
  const res_eval = await executeCommand(`ghdl -e ${project.topLevelEntity}`, dirName);
  if (res_eval.code !== 0) {
    console.log("Evaluation failed")
    return { success: false, vcd: "" };
  }
  const res_run = await executeCommand(`ghdl -r ${project.topLevelEntity} --vcd="out.vcd" --stop-time=${project.simTimeFs}fs`, dirName);
  if (res_run.code !== 0) {
    console.log("Run failed")
    return { success: false, vcd: "" };
  }
  try {
    const data: string = fs.readFileSync(`${dirName}/out.vcd`, "utf8");

    return { success: true, vcd: data };
  } catch (err) {
    return { success: false, vcd: "" };
  }
}

// Пример использования функции processProject
const project: Project = {
  files: [{ fileName: "example.vhd", fileContent: ". VHDL content ." }],
  topLevelEntity: "example",
};
