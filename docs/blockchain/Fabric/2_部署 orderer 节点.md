# 二进制安装部署 Orderer 节点

## 规划网络拓扑

3 个 orderer 节点；组织 org1 , org1 下有两个 peer 节点， peer0 和 peer1; 组织 org2 , org2 下有两个 peer 节点， peer0 和 peer1;

![img](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/up-38ef835b996d7793bb88ed5d61f2305d020-1703763424579-3.png)

| 节点     | 宿主机 IP      | hosts                | 端口（General/Operations/Admin） |
| -------- | -------------- | -------------------- | -------------------------------- |
| cli      | 192.168.159.10 | N/A                  | N/A                              |
| orderer0 | 192.168.159.10 | orderer0.example.com | 7050 , 8443 ， 9443              |
| orderer1 | 192.168.159.10 | orderer1.example.com | 8050 , 8444 ，9444               |
| orderer2 | 192.168.159.10 | orderer2.example.com | 9050 , 8445 ，9445               |

==注：在单机环境下模拟三个排序节点的部署，故每个节点需要区别端口号==

根据 IP 与 host ，在系统 hosts 文件中新增

```bash
vim /etc/hosts

# 新增 
192.168.159.10 orderer0.example.com 
192.168.159.10 orderer1.example.com 
192.168.159.10 orderer2.example.com
```

## 准备工作

[生成网络需要的身份文件](./搭建 Fabric 生产网络.md)

## 部署 orderer 节点

### 部署 orderer 0 节点

在当前项目目录下新建 `orderer0` 文件夹，复制生成 orderer 节点的核心文件到该目录下

```bash
mkdir orderer0

cp bin/orderer config/orderer.yaml orderer0/

cd orderer0
```

编辑 `orderer.yaml`

- 修改 `General.ListenAddress` 为配置当前节点的服务器的 IP，`General.ListenPort` 为为[网络拓扑](#规划网络拓扑) 中的 `General `端口号
- 修改 `General.TLS` 中：
    - `Enabled` 为 `true`
    - `PrivateKey`、`Certificate` 字段，以及`RootCAs` 数组第一项分别为`crypto-config` 中的 `ordererOrganizations` 中的 `orderer0` 的身份文件：私钥`server.key`，节点证书 `server.crt`，CA 证书 `ca.crt` 的路径

- 修改 `General.Cluster` 中 `ClientCertificate`、`ClientPrivateKey` 为节点证书 `server.crt`、私钥`server.key`的路径
- 修改 `General.BootstrapFile` 为创世区块文件 `orderer.genesis.block` 的路径
- 修改 `General.LocalMSPDir` 为 `crypto-config` 中的 `ordererOrganizations` 中的 `orderer0` 的`msp` 文件夹路径

- 修改 `General.LocalMSPID` 为 `OrdererMSP`
- 单机环境下须区分不同节点的 `FileLedger.Location` 目录

- 修改 `Operations.ListenAddress` 的端口为[网络拓扑](#规划网络拓扑) 中的 `Operations `端口号
- 修改 `Admin.ListenAddress` 为端口为[网络拓扑](#规划网络拓扑) 中的 `Admin `端口号

- 单机环境下须区分不同节点的 `Consensus.WALDir` 和 `Consensus.SnapDir` 目录

[完整配置](https://mydoc-pics.oss-cn-chengdu.aliyuncs.com/fabric-config/orderer.yaml)

启动 orderer 0 节点

```bash
nohup ./orderer start > orderer0-log.log 2>&1 &
```

### 部署 orderer 1 节点

参考[orderer 0 节点的部署](###部署 orderer 0 节点)

### 部署 orderer 2 节点

参考[orderer 0 节点的部署](###部署 orderer 0 节点)