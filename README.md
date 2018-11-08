# mmp-cli
git 工作流快捷工具

![1](./intro.png)

针对的工作流场景如下

- 开发分支是从master上拉取的，后续所有在开发分支上的改动，都以cherry-pick的形式到master或develop

- 开发分支不做打包，打包都在master或develop上进行，开发的commit和打包的commit需要分开，以便减少`revert`时的冲突

- 开发分支不push到远程，提交的message需要区分打包和正常的修改提交，且备注分支名称，便于后期查找

