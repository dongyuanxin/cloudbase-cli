#!/usr/bin/env node

const package = require("../package.json");
const program = require("commander");
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");

const NodeDeploy = require("../lib/deploy/node").default;
const NodeController = require("../lib/controller/node").default;

const FunctionDeploy = require("../lib/deploy/function").default;

const { login, logout, getMetadata, askForInput } = require("../lib/utils");

program
  .version(package.version)
  .command("deploy [name]")
  .option("--runtime <runTimeName>", "指定运行时环境")
  .description("执行完整的发布")
  .action(async function(name, options) {
    const { deploys } = getDeploys(name);
    for (let i = 0; i < deploys.length; i++) {
      const deploy = deploys[i];
      if (deploy.type === "node") {
        if (!deploy.path) {
          throw new Error("未指定发布目录");
        }
        const metadata = await getMetadata();
        await new NodeDeploy({
          ...metadata,
          ...deploy
        }).deploy();
        continue;
      }
      if (deploy.type === "function") {
        const metadata = await getMetadata();
        await new FunctionDeploy({
          ...metadata,
          ...deploy,
          runTime: options["runtime"]
        }).deploy();
        continue;
      }
      throw new Error(`Unsupported deploy type: "${deploy.type}"`);
    }
  });

program
  .command("login")
  .description("登录腾讯云账号")
  .action(login);

program
  .command("logout")
  .description("登出腾讯云账号")
  .action(logout);

program
  .command("show")
  .description("查看状态")
  .action(async function() {
    const metadata = await getMetadata();
    await new NodeController(metadata).show();
  });

program
  .command("logs <name>")
  .description("查看日志")
  .option("-n <n>", "输出日志的行数")
  .action(async function(name, options) {
    const {
      deploys: [deploy]
    } = getDeploys(name);
    const metadata = await getMetadata();
    if (deploy.type === "node") {
      await new NodeController({
        ...metadata,
        ...deploy
      }).logs({
        lines: options.n || 20
      });
    }
  });

program
  .command("stop <name>")
  .description("停止应用")
  .action(async function(name) {
    const {
      deploys: [deploy]
    } = getDeploys(name);
    const metadata = await getMetadata();
    if (deploy.type === "node") {
      await new NodeController({
        ...metadata,
        ...deploy
      }).delete();
    }
  });

program
  .command("create <name>")
  .description("创建项目")
  .action(async function(name) {
    fse.copySync(
      path.resolve(__dirname, "../assets/helloworld"),
      path.resolve(process.cwd(), name)
    );
  });

program.parse(process.argv);

function getDeploys(name) {
  const configPath = process.cwd() + "/tcb.json";
  if (!fs.existsSync(configPath)) {
    throw new Error("未找到tcb配置文件");
  }
  const tcbConfig = require(configPath);
  let deploys = tcbConfig.deploys;
  checkDeploys(deploys);
  if (name) {
    deploys = deploys.filter(d => d.name === name);
  }
  return {
    deploys
  };
}

function checkDeploys(deploys) {
  const names = {};
  deploys.forEach(d => {
    if (names[d.name]) {
      throw new Error(`Duplicated depoly name: "${d.name}"`);
    }
    names[d.name] = true;
  });
}
