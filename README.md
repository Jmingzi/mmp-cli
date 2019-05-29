# mmp-cli
git 工作流快捷工具

> Node >= v10.0.0。

## 安装
```shell
npm install mmp-cli -g
```

## API

- 初始化配置
```
  mmp init
```
- 查看配置
```
mmp ls
```
- 提交当前分支到[可选分支]
```
mmp ci [master]
```  
- cherry-pick 某几条提交到某分支
```
# commit_id 是左开右开的
mmp cp [commit_start_id] commit_end_id master
```

- 添加主分支
```
mmp add branch
```
- 设置主分支打包命令
```
mmp set [master] [value]
```
- 添加需要提 pr 的分支
```
mmp add branch -b
```
- 添加需要提 pr 的文件路径
```
mmp add path -f
```
- 删除主分支
```
mmp del branch
```
- 删除需要提 pr 的分支
```
mmp del branch -b
```
- 删除需要提 pr 的文件路径
```
mmp del path -f
```
  
## .mmprc.json

为了与成员共享, 这里会显示项目特定的配置信息

```js
{
  // 需要提 pr 的文件路径
  "prFilePath": [],
  // 需要提 pr 的分支
  "prBr": [],
  // 主分支列表
  "mainBrList": [
    "master",
    "develop"
  ],
  // 主分支打包命令
  "master": "npm run build",
  "develop": "npm run build"
}
```  

