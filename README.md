# mmp-cli
git 工作流快捷工具

> 开发环境 Node v10.8.0，本地保证10或以上即可，nvm use 10.0.0。

## 安装
```shell
npm install mmp-cli -g
```

## 快速使用

```shell
npx mmp-cli -h

# 初始化
npx mmp-cli init

# 提交
npx mmp-cli ci

# 在开发分支提交到主分支
npx mmp-cli ci develop

# 打包
npx mmp-cli build
```

### 场景举例

我们在开发分支开发功能，开发完需要提交到测试环境，目前的流程为
```
add -> commit -> checkout -> cherry-pick(或merge) -> build -> add -> commit -> push
```

而使用mmp，只需一步
```
mmp ci develop
```

### 适配的工作流如下

- 开发分支是从master上拉取的，后续所有在开发分支上的改动，都以cherry-pick的形式到master或develop（rebase -i）

- 开发分支不做打包，打包都在master或develop上进行，开发的commit和打包的commit需要分开，以便减少`revert`时的冲突

- 开发分支不push到远程，提交的message需要区分打包和正常的修改提交，且备注分支名称，便于后期查找

- commit message 一定要备注功能或日常分支名称，并注明改动内容，以方便提取或回滚相应改动

## API

#### `mmp ci [branch]`

提交当前分支到master或develop，`branch`可选，不填默认为当前分支。提交完成后再根据用户选择是否需要打包继续执行，打包后再提交，将2次提交一起推送到仓库。

#### `mmp cp [commit_id] [branch]`

cherry-pick 某个提交到master或develop，参数必填。cherry-pick完成后，会根据用户选择是否需要打包继续完成上述流程。

#### `mmp ls`

列出当前项目的本地配置

#### `mmp init`

初始化主分支的打包命令，master和develop是必须的，其它自定义；

定义的命令可以是任意shell命令，例如
```
cd xx && npm run build && cd ../
```

#### `mmp build`

打包当前分支并提交
