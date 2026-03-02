#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import path from "path";
import { getProjectRootDir } from "../pathManage.js";

const rootPackageJson = JSON.parse(fs.readFileSync(path.join(getProjectRootDir(), "package.json")).toString());

program
  .version(rootPackageJson.version)
  .description("小程序助手 命令工具")
  //
  .command("clear-build-product")
  .description("清理 build 产物")
  .action(() => {
    const currentExecuteDir = process.cwd();

    const buildDirs = [
      path.join(currentExecuteDir, ".turbo"),
      path.join(currentExecuteDir, "dist"),
      path.join(currentExecuteDir, "node_modules/.tmp")
    ];

    for (let item of buildDirs) {
      if (fs.existsSync(item)) {
        fs.rmSync(item, {
          recursive: true
        });
      }
    }
  });

program.parse(process.argv);
