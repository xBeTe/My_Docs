## 规划网络拓扑

3 个 orderer 节点；组织 org1 , org1 下有两个 peer 节点， peer0 和 peer1; 组织 org2 , org2 下有两个 peer 节点， peer0 和 peer1;

![img](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/up-38ef835b996d7793bb88ed5d61f2305d020.png)

| 节点     | 宿主机 IP      | hosts                | 端口（General/Operations/Admin） |
| -------- | -------------- | -------------------- | -------------------------------- |
| cli      | 192.168.159.10 | N/A                  | N/A                              |
| orderer0 | 192.168.159.10 | orderer0.example.com | 7050 , 8443 ， 9443              |
| orderer1 | 192.168.159.10 | orderer1.example.com | 8050 , 8444 ，9444               |
| orderer2 | 192.168.159.10 | orderer2.example.com | 9050 , 8445 ，9445               |

| 节点       | 宿主机 IP      | hosts                  | 端口（peer/chaincode/operations/metrics） |
| ---------- | -------------- | ---------------------- | ----------------------------------------- |
| cli        | 192.168.159.10 | N/A                    | N/A                                       |
| org1-peer0 | 192.168.159.10 | peer0.org1.example.com | 7051 , 7052 , 9446 , 8125                 |
| org1-peer1 | 192.168.159.10 | peer1.org1.example.com | 8051 , 7053 , 9447 , 8126                 |
| org2-peer0 | 192.168.159.10 | peer0.org2.example.com | 9051 , 7054 , 9448 , 8127                 |
| org2-peer1 | 192.168.159.10 | peer1.org2.example.com | 10051 , 7055 , 9449 , 8128                |

==注：在单机环境下模拟三个排序节点的部署，故每个节点需要区别端口号==

根据 IP 与 host ，在系统 hosts 文件中新增

```bash
vim /etc/hosts

192.168.159.10 orderer0.example.com
192.168.159.10 orderer1.example.com
192.168.159.10 orderer2.example.com

# 新增
192.168.159.10 peer0.org1.example.com
192.168.159.10 peer1.org1.example.com

192.168.159.10 peer0.org2.example.com
192.168.159.10 peer1.org2.example.com
```

## 部署 peer 节点

### 部署 org1-peer0 节点

> 部署前请保证 orderer 节点已启动

在当前项目目录下新建 `org1-peer` 文件夹，复制生成 peer 节点的核心文件到该目录下

```bash
mkdir -p org1-peer/peer0
cp bin/order/peer config/core.yaml /org1-peer/peer0

cd /org1-peer/peer0
```

编辑 `core.yaml` 文件：

- 修改 `peer` ：
  - `id` 为配置当前节点的 `peer0.org1.example.com``
  - `listenAddress` 和 `address` 为[网络拓扑](#规划网络拓扑) 中的 `peer ` 的端口和地址
  - `chaincodeListenAddress` 和 `chaincodeAddress` 为[网络拓扑](#规划网络拓扑) 中的 `chaincode ` 的端口和地址
  - `gossip.bootstrap` 为[网络拓扑](#规划网络拓扑) 中的 `peer ` 的端口和地址
  - `tls` 中：
    - `enable` 为 `true`
    - `cert` 、`key`、`rootcert` 的`file` 为生成的身份文件中，该节点的节点证书 `server.crt`，私钥`server.key`，根证书 `ca.crt` 的路径
    - `clientRootCAs.files` 的第一项为根证书 `ca.crt` 的路径
  - 单机环境下需区分 `fileSystemPath` 目录
  - `mspConfigPath` 为身份文件中 `msp` 目录的路径
  - `localMspId` 为：`Org1MSP`
  - 单机环境下需区分 `snapshots.rootDir` 目录
- 修改 `operations.listenAddress` 的端口号为为[网络拓扑](#规划网络拓扑) 中的 `operations ` 的端口
- 修改 `metrics.statsd.address` 的端口号为为[网络拓扑](#规划网络拓扑) 中的 `metrics ` 的端口

[完整配置](https://mydoc-pics.oss-cn-chengdu.aliyuncs.com/fabric-config/core.yaml)

启动 org1-peer0 节点：

```
nohup ./peer node start > org1-peer0.log 2>&1 &
```

### 部署 org1-peer1 节点

参考[org1-peer0 节点 的部署](### 部署 org1-peer0 节点)

### 部署 org2-peer0 节点

参考[org1-peer0 节点 的部署](### 部署 org1-peer0 节点)

### 部署 org2-peer1 节点

参考[org1-peer0 节点 的部署](### 部署 org1-peer0 节点)

## 创建通道

```bash
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/root/project/my-fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

./peer channel create -o orderer0.example.com:7050 -c businesschannel -f "/root/project/my-fabric/channel-artifacts/businesschannel.tx" --timeout "30s" --tls --cafile /root/project/my-fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

创建成功后会在当前路径下生成 `businesschannel.block` 文件。

```bash
mv businesschannel.block /root/project/my-fabric/channel-artifacts
```

## 加入通道

org1-peer0 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/root/project/my-fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/root/project/my-fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

# 执行前须进入该节点 peer 文件所在目录
./peer channel join -b /root/project/my-fabric/channel-artifacts/businesschannel.block
```

加入成功可以看到如下输出：

```
2022-02-22 08:58:09.295 EST 0002 INFO [channelCmd] executeJoin -> Successfully submitted proposal to join channel
```

org1-peer1 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true

export CORE_PEER_LOCALMSPID="Org1MSP"

export CORE_PEER_TLS_ROOTCERT_FILE=/root/project/my-fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt

export CORE_PEER_MSPCONFIGPATH=/root/project/my-fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

export CORE_PEER_ADDRESS=peer1.org1.example.com:8051

# 执行前须进入该节点 peer 文件所在目录
./peer channel join -b /root/project/my-fabric/channel-artifacts/businesschannel.block
```

org2-peer0 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/root/project/my-fabric/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/root/project/my-fabric/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer0.org2.example.com:9051

# 执行前须进入该节点 peer 文件所在目录
./peer channel join -b /root/project/my-fabric/channel-artifacts/businesschannel.block
```

org2-peer1 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/root/project/my-fabric/crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/root/project/my-fabric/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer1.org2.example.com:10051

# 执行前须进入该节点 peer 文件所在目录
./peer channel join -b /root/project/my-fabric/channel-artifacts/businesschannel.block
```

查看 peer 节点加入的通道：

```
./peer channel list
```

输出如下：

```bash
2022-02-22 09:03:02.681 EST 0001 INFO [channelCmd] InitCmdFactory -> Endorser and orderer connections initialized
Channels peers has joined: 
businesschannel
```

