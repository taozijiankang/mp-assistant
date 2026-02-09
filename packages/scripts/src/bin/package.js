import { program } from "commander";
import path from "path";
import fs from "fs";
import { getDashboardDir, getServerDir } from "../pathManage.js";

program
  .command("package-server [others...]")
  .description("package server 包")
  .action(() => {
    packageServer();
  })
  .parse(process.argv);

function packageServer() {
  // 把web的dist复制到server的web_dist目录下
  const webDistPath = path.join(getDashboardDir(), "dist");
  const serverDashboardDistPath = path.join(getServerDir(), "dist_dashboard");

  fs.cpSync(webDistPath, serverDashboardDistPath, { recursive: true });

  console.log("复制dashboard dist到server dist_dashboard目录成功");
}
