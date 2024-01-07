# 使用 Docker 部署生产网络 

## 规划网络拓扑

3 个 orderer 节点；组织 org1 , org1 下有两个 peer 节点， peer0 和 peer1; 组织 org2 , org2 下有两个 peer 节点， peer0 和 peer1;

![img](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/up-38ef835b996d7793bb88ed5d61f2305d020.png)

| 节点     | 宿主机 IP      | hosts                | 端口 |
| -------- | -------------- | -------------------- | ---- |
| cli      | 192.168.159.10 | N/A                  | N/A  |
| orderer0 | 192.168.159.10 | orderer0.example.com | 7050 |
| orderer1 | 192.168.159.10 | orderer1.example.com | 8050 |
| orderer2 | 192.168.159.10 | orderer2.example.com | 9050 |

| 节点       | 宿主机 IP      | hosts                  | 端口  |
| ---------- | -------------- | ---------------------- | ----- |
| cli        | 192.168.159.10 | N/A                    | N/A   |
| org1-peer0 | 192.168.159.10 | peer0.org1.example.com | 7051  |
| org1-peer1 | 192.168.159.10 | peer1.org1.example.com | 8051  |
| org2-peer0 | 192.168.159.10 | peer0.org2.example.com | 9051  |
| org2-peer1 | 192.168.159.10 | peer1.org2.example.com | 10051 |

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



> 注意：部署过程中使用的 order、peer、tools 等镜像版本为 2.4.1，使用 2.5.x 版本的镜像在加入通道时可能会出现位置错误

## 部署 orderer 节点

使用 docker compose 部署 orderer 节点

### 编写 orderer 节点 docker-compose 文件

```yaml
version: '2.0'

services:

    cli:
        image: hyperledger/fabric-tools:2.4.1
        restart: always
        container_name: fabric-cli
        hostname: fabric-cli
        tty: true
        extra_hosts:
            - "orderer0.example.com:192.168.159.10"
            - "orderer1.example.com:192.168.159.10"
            - "orderer2.example.com:192.168.159.10"
            - "peer0.org1.example.com:192.168.159.10"
            - "peer1.org1.example.com:192.168.159.10"
            - "peer0.org2.example.com:192.168.159.10"
            - "peer1.org2.example.com:192.168.159.10"
        environment:
            - CORE_PEER_ID=fabric-cli
            - CORE_PEER_ADDRESS=peer0.org1.example.com:7051 # default to operate on peer0.org1
            - CORE_PEER_LOCALMSPID=Org1MSP
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
            - CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
            - FABRIC_LOGGING_SPEC=DEBUG
            - FABRIC_LOGGING_FORMAT=%{color}[%{id:03x} %{time:01-02 15:04:05.00 MST}] [%{module}] %{shortfunc} -> %{level:.4s}%{color:reset} %{message}
            - CORE_PEER_TLS_ENABLED=true  # to enable TLS, change to true
            - ORDERER_CA=/etc/hyperledger/fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
        volumes:
            - ../config/crypto-config.yaml:/etc/hyperledger/fabric/crypto-config.yaml
            - ../config/configtx.yaml:/etc/hyperledger/fabric/configtx.yaml
            - ../crypto-config:/etc/hyperledger/fabric/crypto-config
            - ../channel-artifacts:/tmp/channel-artifacts
            - ../chaincodes:/etc/hyperledger/fabric/chaincodes
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        command: bash -c 'cd /tmp; source scripts/func.sh; while true; do sleep 20170504; done'


    orderer0.example.com:  # There can be multiple orderers
        image: hyperledger/fabric-orderer:2.4.1
        restart: always
        container_name: orderer0.example.com
        hostname: orderer0.example.com
        ports:
            - "7050:7050"
            - "8443:8443"
        extra_hosts:
            - "orderer0.example.com:192.168.159.10"
            - "orderer1.example.com:192.168.159.10"
            - "orderer2.example.com:192.168.159.10"
            - "peer0.org1.example.com:192.168.159.10"
            - "peer1.org1.example.com:192.168.159.10"
            - "peer0.org2.example.com:192.168.159.10"
            - "peer1.org2.example.com:192.168.159.10"
        environment:
            - FABRIC_LOGGING_FORMAT="%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}"
            - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0 # default: 127.0.0.1
            - ORDERER_GENERAL_LISTENPORT=7050
            - ORDERER_GENERAL_GENESISMETHOD=file # default: provisional
            - ORDERER_GENERAL_BOOTSTRAPFILE=/etc/hyperledger/fabric/orderer.genesis.block # by default, all materials should be put under $FABRIC_CFG_PATH, which defaults to /etc/hyperledger/fabric
            - ORDERER_GENERAL_LOCALMSPID=OrdererMSP # default: DEFAULT
            - ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/fabric/msp
            - ORDERER_GENERAL_LEDGERTYPE=file
            #- ORDERER_GENERAL_LEDGERTYPE=json  # default: file
            - ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:8443  # operation RESTful API
            - ORDERER_METRICS_PROVIDER=prometheus  # prometheus will pull metrics from orderer via /metrics RESTful API
            #- ORDERER_RAMLEDGER_HISTORY_SIZE=100  #only useful when use ram ledger
            # enabled TLS
            - ORDERER_GENERAL_TLS_ENABLED=true # default: false
            - ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/fabric/tls/server.key
            - ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/fabric/tls/server.crt
            - ORDERER_GENERAL_TLS_ROOTCAS=[/etc/hyperledger/fabric/tls/ca.crt]
            # Only required by raft mode
            - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/etc/hyperledger/fabric/tls/server.key
            - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/etc/hyperledger/fabric/tls/server.crt
            - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/etc/hyperledger/fabric/tls/ca.crt]
            - FABRIC_LOGGING_SPEC=DEBUG
        volumes:
            - ../crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp:/etc/hyperledger/fabric/msp
            - ../crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls/:/etc/hyperledger/fabric/tls
            - ../channel-artifacts/orderer.genesis.block:/etc/hyperledger/fabric/orderer.genesis.block
#            - /var/hyperledger/production:/var/hyperledger/production
        expose:
            - "7050"  # gRPC
            - "8443"  # Operation REST
        command: orderer start

    orderer1.example.com:
        image: hyperledger/fabric-orderer:2.4.1
        restart: always
        container_name: orderer1.example.com
        hostname: orderer1.example.com
        ports:
            - "8050:7050"
            - "8444:8443"
        extra_hosts:
            - "orderer0.example.com:192.168.159.10"
            - "orderer1.example.com:192.168.159.10"
            - "orderer2.example.com:192.168.159.10"
            - "peer0.org1.example.com:192.168.159.10"
            - "peer1.org1.example.com:192.168.159.10"
            - "peer0.org2.example.com:192.168.159.10"
            - "peer1.org2.example.com:192.168.159.10"
        environment:
            - FABRIC_LOGGING_SPEC=DEBUG
            - FABRIC_LOGGING_FORMAT="%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}"
            - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0 # default: 127.0.0.1
            - ORDERER_GENERAL_LISTENPORT=7050
            - ORDERER_GENERAL_GENESISMETHOD=file # default: provisional
            - ORDERER_GENERAL_BOOTSTRAPFILE=/etc/hyperledger/fabric/orderer.genesis.block # by default, all materials should be put under $FABRIC_CFG_PATH, which defaults to /etc/hyperledger/fabric
            - ORDERER_GENERAL_LOCALMSPID=OrdererMSP # default: DEFAULT
            - ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/fabric/msp
            - ORDERER_GENERAL_LEDGERTYPE=file
            #- ORDERER_GENERAL_LEDGERTYPE=json  # default: file
            - ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:8443  # operation RESTful API
            - ORDERER_METRICS_PROVIDER=prometheus  # prometheus will pull metrics from orderer via /metrics RESTful API
            #- ORDERER_RAMLEDGER_HISTORY_SIZE=100  #only useful when use ram ledger
            # enabled TLS
            - ORDERER_GENERAL_TLS_ENABLED=true # default: false
            - ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/fabric/tls/server.key
            - ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/fabric/tls/server.crt
            - ORDERER_GENERAL_TLS_ROOTCAS=[/etc/hyperledger/fabric/tls/ca.crt]
            # Only required by raft mode
            - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/etc/hyperledger/fabric/tls/server.key
            - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/etc/hyperledger/fabric/tls/server.crt
            - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/etc/hyperledger/fabric/tls/ca.crt]
            - ORDERER_GENERAL_CLUSTER_SENDBUFFERSIZE=10
        volumes:
            - ../crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp:/etc/hyperledger/fabric/msp
            - ../crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/:/etc/hyperledger/fabric/tls
            - ../channel-artifacts/orderer.genesis.block:/etc/hyperledger/fabric/orderer.genesis.block
#            - /var/hyperledger/production:/var/hyperledger/production
        command: orderer start    


    orderer2.example.com:
        image: hyperledger/fabric-orderer:2.4.1
        restart: always
        container_name: orderer2.example.com
        hostname: orderer2.example.com
        ports:
            - "9050:7050"
            - "8445:8443"
        extra_hosts:
            - "orderer0.example.com:192.168.159.10"
            - "orderer1.example.com:192.168.159.10"
            - "orderer2.example.com:192.168.159.10"
            - "peer0.org1.example.com:192.168.159.10"
            - "peer1.org1.example.com:192.168.159.10"
            - "peer0.org2.example.com:192.168.159.10"
            - "peer1.org2.example.com:192.168.159.10"
        environment:
            - FABRIC_LOGGING_SPEC=DEBUG  # default: INFO
            - FABRIC_LOGGING_FORMAT="%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}"
            - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0 # default: 127.0.0.1
            - ORDERER_GENERAL_LISTENPORT=7050
            - ORDERER_GENERAL_GENESISMETHOD=file # default: provisional
            - ORDERER_GENERAL_BOOTSTRAPFILE=/etc/hyperledger/fabric/orderer.genesis.block # by default, all materials should be put under $FABRIC_CFG_PATH, which defaults to /etc/hyperledger/fabric
            - ORDERER_GENERAL_LOCALMSPID=OrdererMSP # default: DEFAULT
            - ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/fabric/msp
            - ORDERER_GENERAL_LEDGERTYPE=file
            #- ORDERER_GENERAL_LEDGERTYPE=json  # default: file
            - ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:8443  # operation RESTful API
            - ORDERER_METRICS_PROVIDER=prometheus  # prometheus will pull metrics from orderer via /metrics RESTful API
            #- ORDERER_RAMLEDGER_HISTORY_SIZE=100  #only useful when use ram ledger
            # enabled TLS
            - ORDERER_GENERAL_TLS_ENABLED=true # default: false
            - ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/fabric/tls/server.key
            - ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/fabric/tls/server.crt
            - ORDERER_GENERAL_TLS_ROOTCAS=[/etc/hyperledger/fabric/tls/ca.crt]
            # Only required by raft mode
            - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/etc/hyperledger/fabric/tls/server.key
            - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/etc/hyperledger/fabric/tls/server.crt
            - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/etc/hyperledger/fabric/tls/ca.crt]
            - ORDERER_GENERAL_CLUSTER_SENDBUFFERSIZE=10
        volumes:
            - ../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp:/etc/hyperledger/fabric/msp
            - ../crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/:/etc/hyperledger/fabric/tls
            - ../channel-artifacts/orderer.genesis.block:/etc/hyperledger/fabric/orderer.genesis.block
#            - /var/hyperledger/production:/var/hyperledger/production
        command: orderer start
```

> 注：
>
> - 在单机环境下部署，不同节点之间内部端口可以相同，但需要区分容器在宿主机中映射的端口
>
> ```yaml
> orderer0.example.com:
> 	...
> 	ports: 
>         - "7050:7050"
>         - "8443:8443"
>      ...
> orderer1.example.com:
>     ...
>     ports:
>         - "8050:7050"
>         - "8444:8443"
>     ...        
> orderer2.example.com:
> 	...
>     ports:
>         - "9050:7050"
>         - "8445:8443"
>     ...
>     
> ```
> 
> - 修改 `volumes` 中映射的宿主机目录为正确目录

启动 orderer 节点：

```bash
docker-compose -f docker-compose-3orderer.yaml up -d
```

如果想停止并且删除服务：

```bash
docker-compose -f docker-compose-3orderer.yaml down
```

## 部署 org1 peer 节点

### 编写 docker-compose 文件

```yaml
version: '2.0'

services:

    peer0.org2.example.com:
        image: hyperledger/fabric-peer:2.4.1
        restart: always
        container_name: peer0.org2.example.com
        hostname: peer0.org2.example.com
        ports:
            - 9051:7051
            - 9052:7052
            - 9445:9443	
        extra_hosts:
            - "orderer0.example.com:192.168.159.10"
            - "orderer1.example.com:192.168.159.10"
            - "orderer2.example.com:192.168.159.10"
            - "peer0.org1.example.com:192.168.159.10"
            - "peer1.org1.example.com:192.168.159.10"
            - "peer0.org2.example.com:192.168.159.10"
            - "peer1.org2.example.com:192.168.159.10"
        environment:
            - FABRIC_LOGGING_SPEC=INFO
            - FABRIC_LOGGING_FORMAT="%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}"
            - CORE_PEER_ADDRESSAUTODETECT=false
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=host  # uncomment this to use specific network
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_PEER_GOSSIP_ORGLEADER=false  # whether this node is the org leader, default to false
            - CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:9443  # operation RESTful API
            - CORE_METRICS_PROVIDER=prometheus  # prometheus will pull metrics from fabric via /metrics RESTful API
            - CORE_PEER_PROFILE_ENABLED=false
            - CORE_PEER_TLS_ENABLED=true
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
            - CORE_CHAINCODE_BUILDER=hyperledger/fabric-ccenv:2.4.1
            - CORE_CHAINCODE_GOLANG_RUNTIME=hyperledger/fabric-baseos:2.4.1
            - CORE_CHAINCODE_JAVA_RUNTIME=hyperledger/fabric-javaenv:2.4.1
            - CORE_CHAINCODE_NODE_RUNTIME=hyperledger/fabric-nodeenv:2.4.1
            - CORE_PEER_ID=peer0.org2.example.com
            - CORE_PEER_ADDRESS=peer0.org2.example.com:9051
            - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
            - CORE_PEER_CHAINCODEADDRESS=peer0.org2.example.com:9052
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org2.example.com:9051
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org2.example.com:9051
            - CORE_PEER_LOCALMSPID=Org2MSP
            - FABRIC_LOGGING_SPEC=DEBUG # info:core.chaincode=debug
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=peer0.org2.couchdb:5984
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - ../crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp:/etc/hyperledger/fabric/msp
            - ../crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls:/etc/hyperledger/fabric/tls
#            - /var/hyperledger/production:/var/hyperledger/production
        expose:
            - "9051"  # gRPC
            - "9445"  # Operation REST
        #command: bash -c 'bash /tmp/peer_build.sh; peer node start'
        command: peer node start
        depends_on:
            - peer0.org2.couchdb


    peer1.org2.example.com:
        image: hyperledger/fabric-peer:2.4.1
        restart: always
        container_name: peer1.org2.example.com
        hostname: peer1.org2.example.com
        ports:
            - 10051:7051
            - 10052:7052
            - 9446:9443
        extra_hosts:
            - "orderer0.example.com:192.168.159.10"
            - "orderer1.example.com:192.168.159.10"
            - "orderer2.example.com:192.168.159.10"
            - "peer0.org1.example.com:192.168.159.10"
            - "peer1.org1.example.com:192.168.159.10"
            - "peer0.org2.example.com:192.168.159.10"
            - "peer1.org2.example.com:192.168.159.10"
        environment:
            - FABRIC_LOGGING_SPEC=INFO
            - FABRIC_LOGGING_FORMAT="%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}"
            - CORE_PEER_ADDRESSAUTODETECT=false
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=host  # uncomment this to use specific network
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_PEER_GOSSIP_ORGLEADER=false  # whether this node is the org leader, default to false
            - CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:9443  # operation RESTful API
            - CORE_METRICS_PROVIDER=prometheus  # prometheus will pull metrics from fabric via /metrics RESTful API
            - CORE_PEER_PROFILE_ENABLED=false
            - CORE_PEER_TLS_ENABLED=true
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
            - CORE_CHAINCODE_BUILDER=hyperledger/fabric-ccenv:2.4.1
            - CORE_CHAINCODE_GOLANG_RUNTIME=hyperledger/fabric-baseos:2.4.1
            - CORE_CHAINCODE_JAVA_RUNTIME=hyperledger/fabric-javaenv:2.4.1
            - CORE_CHAINCODE_NODE_RUNTIME=hyperledger/fabric-nodeenv:2.4.1
            - CORE_PEER_ID=peer1.org2.example.com
            - CORE_PEER_ADDRESS=peer1.org2.example.com:10051
            - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
            - CORE_PEER_CHAINCODEADDRESS=peer1.org2.example.com:10052
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer1.org2.example.com:10051
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer1.org2.example.com:10051
            - CORE_PEER_LOCALMSPID=Org2MSP
            - FABRIC_LOGGING_SPEC=DEBUG # info:core.chaincode=debug
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=peer1.org2.couchdb:5984
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=adminpw
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - ../crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/msp:/etc/hyperledger/fabric/msp
            - ../crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls:/etc/hyperledger/fabric/tls
#            - /var/hyperledger/production:/var/hyperledger/production
        expose:
            - "10051"  # gRPC
            - "9446"  # Operation REST
        #command: bash -c 'bash /tmp/peer_build.sh; peer node start'
        command: peer node start
        depends_on:
            - peer1.org2.couchdb


    peer0.org2.couchdb:
        image: couchdb:3.1.1
        container_name: peer0.org2.couchdb
        ports:
            - 7984:5984  # this is the restful API addr, can also access fauxton web ui thru http://localhost:5984/_utils/
        environment:
            - COUCHDB_USER=admin
            - COUCHDB_PASSWORD=adminpw

    peer1.org2.couchdb:
        image: couchdb:3.1.1
        container_name: peer1.org2.couchdb
        ports:
            - 8984:5984  # this is the restful API addr, can also access fauxton web ui thru http://localhost:5984/_utils/
        environment:
            - COUCHDB_USER=admin
            - COUCHDB_PASSWORD=adminpw
```

启动 org2 peer 节点：

```
docker-compose -f docker-compose-org2-2peer.yaml up -d
```

## 创建通道

进入 cli 容器：

```bash
docker exec -it fabric-cli bash
```

```bash
export APP_CHANNEL=businesschannel
export TIMEOUT=30
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

peer channel create -o orderer0.example.com:7050 -c ${APP_CHANNEL} -f "/tmp/channel-artifacts/$APP_CHANNEL.tx" --timeout "${TIMEOUT}s" --tls --cafile /etc/hyperledger/fabric/crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

创建成功后会在当前路径下生成 `businesschannel.block` 文件。

```
mv businesschannel.block /tmp/channel-artifacts/
```

## 加入通道

进入 cli 容器：

```
docker exec -it fabric-cli bash
```

org1-peer0 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

peer channel join -b /tmp/channel-artifacts/businesschannel.block
```

结果如下：

```bash
[020 02-18 03:57:28.30 UTC] [channelCmd] executeJoin -> INFO Successfully submitted proposal to join channel
```

org1-peer1 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer1.org1.example.com:8051


peer channel join -b /tmp/channel-artifacts/businesschannel.block
```

org2-peer0 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer0.org2.example.com:9051

peer channel join -b /tmp/channel-artifacts/businesschannel.block
```

org2-peer1 加入通道：

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=peer1.org2.example.com:10051

peer channel join -b /tmp/channel-artifacts/businesschannel.block
```
