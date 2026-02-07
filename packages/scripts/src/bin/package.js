import { program } from "commander";
import path from "path";
import fs from "fs";
import { getPackagesDir } from "../pathManage.js";

program
  .option("--package-server")
  .description("package server 包")
  .action(() => {
    // 把web的dist复制到server的web_dist目录下

    const webDistPath = path.join(getPackagesDir(), "web/dist");
    const serverWebDistPath = path.join(getPackagesDir(), "server/web_dist");
    fs.cpSync(webDistPath, serverWebDistPath, { recursive: true });

    console.log("package server 包成功");
  })
  .parse(process.argv);
