/* eslint-disable @typescript-eslint/no-require-imports */
const inquirer = require('inquirer')
const semver = require('semver')
const package = require('../package.json')
const { exec } = require('child_process')

async function retry() {
    const confirm = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'try',
            message: '是否重新尝试发布？',
            default: false
        }
    ])

    if (confirm.try) {
        publish()
    }
}

async function publish() {
    const config = await inquirer.prompt([
        {
            type: 'list',
            name: 'version',
            message: '请选择本次发布的版本类型：',
            choices: ['Prerelease', 'Patch', 'Minor', 'Major'],
            filter: function(val) {
                return val.toLowerCase()
            }
        },
        {
            type: 'confirm',
            name: 'isLatest',
            message: '是正式版发布吗？',
            default: false
        }
    ])

    if (config.isLatest && config.version === 'prerelease') {
        console.log('PreRelease版本不能发布正式版！')
        setImmediate(retry)
        return
    }

    if (!config.isLatest && config.version !== 'prerelease') {
        config.version = 'pre' + config.version
    }

    let newVersion = semver.inc(package.version, config.version)

    const publishCommand =
        'npm publish' + (config.isLatest ? '' : ' --tag beta')

    const confirmMessage = `请确认核对信息：
  ==========发布信息==========
  当前版本：${package.version}
  发布版本：${newVersion}
  执行命令：npm version ${newVersion} && ${publishCommand}
  ==========发布信息==========
  以上信息确认无误？`
    const confirm = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'result',
            message: confirmMessage,
            default: false
        }
    ])

    if (confirm.result) {
        console.log('发布中...')
        exec(
            `npm version ${newVersion} && ${publishCommand}`,
            (err, stdout, stderr) => {
                if (err) {
                    console.error(err)
                }

                stdout && console.log(stdout)
                stderr && console.error(stderr)

                if (stdout && !stderr) {
                    console.log('发布成功！')
                }
            }
        )
    }
}

publish()
