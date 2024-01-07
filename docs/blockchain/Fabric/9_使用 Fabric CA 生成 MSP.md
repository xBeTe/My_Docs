---
title: 使用 Fabric CA 生成 MSP
---

# 使用 Fabric CA 生成 MSP

## Fabric CA 网络拓扑

![_images/network_topology.png](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/network_topology.png)





![image.png](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/2b325ad4e7704d6e81dededc74808ac2~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp)

------

## 部署 Fabric CA

编辑 `docker-compose-ca.yaml`

```yaml
version: '2.0'

networks:
  fabric-ca:
    name: fabric-ca

services:

  ca-tls:
    container_name: ca-tls
    image: hyperledger/fabric-ca
    command: sh -c 'fabric-ca-server start -d -b tls-ca-admin:tls-ca-adminpw --port 7052'
    environment:
      - FABRIC_CA_SERVER_HOME=/tmp/hyperledger/fabric-ca/crypto
      - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_CSR_CN=ca-tls
      - FABRIC_CA_SERVER_CSR_HOSTS=0.0.0.0
      - FABRIC_CA_SERVER_DEBUG=true
      - FABRIC_CA_SERVER_DB_TYPE=mysql
      - FABRIC_CA_SERVER_DB_DATASOURCE=root:999795@tcp(192.168.159.11:3306)/fabric_ca_tls?parseTime=true
    volumes:
      - /tmp/hyperledger/tls-ca:/tmp/hyperledger/fabric-ca
    networks:
      - fabric-ca
    ports:
      - 7052:7052

  rca-org0:
    container_name: rca-org0
    image: hyperledger/fabric-ca
    command: /bin/bash -c 'fabric-ca-server start -d -b rca-org0-admin:rca-org0-adminpw --port 7053'
    environment:
      - FABRIC_CA_SERVER_HOME=/tmp/hyperledger/fabric-ca/crypto
      - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_CSR_CN=rca-org0
      - FABRIC_CA_SERVER_CSR_HOSTS=0.0.0.0
      - FABRIC_CA_SERVER_DEBUG=true
      - FABRIC_CA_SERVER_DB_TYPE=mysql
      - FABRIC_CA_SERVER_DB_DATASOURCE=root:999795@tcp(192.168.159.11:3306)/fabric_rca_org0?parseTime=true
    volumes:
      - /tmp/hyperledger/org0/ca:/tmp/hyperledger/fabric-ca
    networks:
      - fabric-ca
    ports:
      - 7053:7053

  rca-org1:
    container_name: rca-org1
    image: hyperledger/fabric-ca
    command: /bin/bash -c 'fabric-ca-server start -d -b rca-org1-admin:rca-org1-adminpw'
    environment:
      - FABRIC_CA_SERVER_HOME=/tmp/hyperledger/fabric-ca/crypto
      - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_CSR_CN=rca-org1
      - FABRIC_CA_SERVER_CSR_HOSTS=0.0.0.0
      - FABRIC_CA_SERVER_DEBUG=true
      - FABRIC_CA_SERVER_DB_TYPE=mysql
      - FABRIC_CA_SERVER_DB_DATASOURCE=root:999795@tcp(192.168.159.11:3306)/fabric_rca_org1?parseTime=true
    volumes:
      - /tmp/hyperledger/org1/ca:/tmp/hyperledger/fabric-ca
    networks:
      - fabric-ca
    ports:
      - 7054:7054

  rca-org2:
    container_name: rca-org2
    image: hyperledger/fabric-ca
    command: /bin/bash -c 'fabric-ca-server start -d -b rca-org2-admin:rca-org2-adminpw --port 7055'
    environment:
      - FABRIC_CA_SERVER_HOME=/tmp/hyperledger/fabric-ca/crypto
      - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_CSR_CN=rca-org2
      - FABRIC_CA_SERVER_CSR_HOSTS=0.0.0.0
      - FABRIC_CA_SERVER_DEBUG=true
      - FABRIC_CA_SERVER_DB_TYPE=mysql
      - FABRIC_CA_SERVER_DB_DATASOURCE=root:999795@tcp(192.168.159.11:3306)/fabric_rca_org2?parseTime=true
    volumes:
      - /tmp/hyperledger/org2/ca:/tmp/hyperledger/fabric-ca
    networks:
      - fabric-ca
    ports:
      - 7055:7055

```

启动 fabric ca 服务：

```bash
docker-compose -f docker-compose-ca.yaml up -d
```

工作目录结构：

```bash
/tmp/hyperledger
├── fabric-ca-client
├── org0
├── org1
├── org2
└── tls-ca
```

## 注册 TLS CA 管理员，注册节点身份

```bash
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/tls-ca/crypto/tls-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/tls-ca/admin

cp tls-ca/crypto/ca-cert.pem tls-ca/crypto/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminpw@0.0.0.0:7052
```

注册 org1 的两个 peer 节点：

```bash
./fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:7052
./fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer2PW --id.type peer -u https://0.0.0.0:7052
```

注册 org2 的两个 peer 节点：

```bash
./fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:7052
./fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer2PW --id.type peer -u https://0.0.0.0:7052
```

注册 3 个 orderer 节点：

```bash
./fabric-ca-client register -d --id.name orderer0.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:7052

./fabric-ca-client register -d --id.name orderer1.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:7052

./fabric-ca-client register -d --id.name orderer2.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:7052
```

## Enroll Orderer Org’s CA Admin

register orderer1 节点 & org0 管理员

```bash
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/ca/admin

./fabric-ca-client enroll -d -u https://rca-org0-admin:rca-org0-adminpw@0.0.0.0:7053

./fabric-ca-client register -d --id.name orderer0.example.com --id.secret ordererpw --id.type orderer -u https://0.0.0.0:7053

./fabric-ca-client register -d --id.name admin-org0 --id.secret org0adminpw --id.type admin --id.attrs "hf.Registrar.Roles=*,hf.Registrar.DelegateRoles=*,hf.AffiliationMgr=true,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert" -u https://0.0.0.0:7053
```

register orderer2 节点

```bash
./fabric-ca-client register -d --id.name orderer1.example.com --id.secret ordererpw --id.type orderer -u https://0.0.0.0:7053
```

register orderer3 节点

```bash
./fabric-ca-client register -d --id.name orderer2.example.com --id.secret ordererpw --id.type orderer -u https://0.0.0.0:7053
```

## Enroll Org1’s CA Admin

```bash
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1/ca/admin

./fabric-ca-client enroll -d -u https://rca-org1-admin:rca-org1-adminpw@0.0.0.0:7054

./fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:7054

./fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer2PW --id.type peer -u https://0.0.0.0:7054

./fabric-ca-client register -d --id.name admin-org1 --id.secret org1AdminPW --id.type admin --id.attrs "hf.Registrar.Roles=*,hf.Registrar.DelegateRoles=*,hf.AffiliationMgr=true,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert" -u https://0.0.0.0:7054

./fabric-ca-client register -d --id.name user-org1 --id.secret org1UserPW --id.type user -u https://0.0.0.0:7054
```

## Enrolling Org2’s CA Admin

```bash
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2/ca/admin

./fabric-ca-client enroll -d -u https://rca-org2-admin:rca-org2-adminpw@0.0.0.0:7055

./fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:7055

./fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer2PW --id.type peer -u https://0.0.0.0:7055

./fabric-ca-client register -d --id.name admin-org2 --id.secret org2AdminPW --id.type admin --id.attrs "hf.Registrar.Roles=*,hf.Registrar.DelegateRoles=*,hf.AffiliationMgr=true,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert" -u https://0.0.0.0:7055

./fabric-ca-client register -d --id.name user-org2 --id.secret org2UserPW --id.type user -u https://0.0.0.0:7055
```

## Enroll Org1’s Peers

### Enroll Org1 Peer1

#### enroll Org1 Peer1 ECert 证书

```bash
mkdir -p org1/peer1/assets/ca/ && cp org1/ca/crypto/ca-cert.pem org1/peer1/assets/ca/org1-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1/peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1/peer1/assets/ca/org1-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer1PW@0.0.0.0:7054

# 更改私钥文件名称
mv org1/peer1/msp/keystore/6ad80735398e8b939257638583b784062c7b7d4fac495f95a8fcda51109689be_sk org1/peer1/msp/keystore/priv_sk

mkdir -p org1/peer1/msp/admincerts/
```

#### Enroll Org1 Peer1 TLS 证书

```bash
mkdir -p org1/peer1/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org1/peer1/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1/peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1/peer1/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer1PW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts peer0.org1.example.com

# 将 keystore 路径下的文件改名为 key.pem
mv org1/peer1/tls-msp/keystore/ab98eb578f9cbae9a4ba19930aa64de969a8a9dab4745ed2e268179f3c19c98a_sk org1/peer1/tls-msp/keystore/key.pem
```

### Enroll Peer2

#### Enroll Org1 Peer2 ECert 证书

```bash
mkdir -p org1/peer2/assets/ca/ && cp org1/ca/crypto/ca-cert.pem org1/peer2/assets/ca/org1-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1/peer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1/peer2/assets/ca/org1-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer2PW@0.0.0.0:7054

# 修改私钥文件名称
mv org1/peer2/msp/keystore/9a1d0af6644d92eb2480ebf949646aeadaeb056f63cc657a1abf99e684f09353_sk org1/peer2/msp/keystore/priv_sk

mkdir -p org1/peer2/msp/admincerts/
```

#### Enroll Org1 Peer1 TLS 证书

```bash
mkdir -p org1/peer2/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org1/peer2/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1/peer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1/peer2/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer2PW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts peer1.org1.example.com

# 将 keystore 路径下的文件改名为 key.pem
mv org1/peer2/tls-msp/keystore/453d462a17fab6a8ce766222e471bb357731bd931d03102bef7c50f9d2413502_sk org1/peer2/tls-msp/keystore/key.pem
```

### Enroll Org1’s Admin

```bash
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1/peer1/assets/ca/org1-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://admin-org1:org1AdminPW@0.0.0.0:7054

# 修改私钥文件名称
mv /tmp/hyperledger/org1/admin/msp/keystore/582112d3dcce1f7b4d3b81707d78740192903dd3de3560b559bb2c6f2a737afc_sk /tmp/hyperledger/org1/admin/msp/keystore/priv_sk

cp /tmp/hyperledger/org1/admin/msp/signcerts/cert.pem /tmp/hyperledger/org1/peer1/msp/admincerts/org1-admin-cert.pem

cp /tmp/hyperledger/org1/admin/msp/signcerts/cert.pem /tmp/hyperledger/org1/peer2/msp/admincerts/org1-admin-cert.pem
```

------

## Enroll Org2’s Peers

### Enroll Org2 Peer1

#### Enroll Org2 Peer1 ECert 证书

```bash
mkdir -p org2/peer1/assets/ca/ && cp org2/ca/crypto/ca-cert.pem org2/peer1/assets/ca/org2-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2/peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2/peer1/assets/ca/org2-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer1PW@0.0.0.0:7055

# 修改私钥文件名称
mv org2/peer1/msp/keystore/f509050d7ed2d00840fd376c9f3608bf6d30a56243df925e6ddf8f56f8f079d7_sk org2/peer1/msp/keystore/priv_sk
```

#### Enroll Org2 Peer1 TLS 证书

```bash
mkdir org2/peer1/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org2/peer1/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2/peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2/peer1/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer1PW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts peer0.org2.example.com

# 将 keystore 路径下的文件改名为 key.pem
mv org2/peer1/tls-msp/keystore/93d05088bfc052590e6be5443a9eea366fb809f332e776a8de00af65414270a6_sk org2/peer1/tls-msp/keystore/key.pem
```

### Enroll Org2 Peer2

#### Enroll Org2 Peer2 ECert 证书

```bash
mkdir -p org2/peer2/assets/ca/ && cp org2/ca/crypto/ca-cert.pem org2/peer2/assets/ca/org2-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2/peer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2/peer2/assets/ca/org2-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer2PW@0.0.0.0:7055

# 修改私钥文件名称
mv org2/peer2/msp/keystore/e9cf22b0d86fb74982aa6a0a07d5ce87dc68b11a720fb58d790c270226d29467_sk org2/peer2/msp/keystore/priv_sk
```

#### Enroll Org2 Peer2 TLS 证书

```bash
mkdir -p org2/peer2/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org2/peer2/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2/peer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2/peer2/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer2PW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts peer1.org2.example.com

# 将 keystore 路径下的文件改名为 key.pem
mv org2/peer2/tls-msp/keystore/aae8347ef1fe0fb9b333f8685a33a1084704ffd4d4f3e5af1ed4463f8381588c_sk org2/peer2/tls-msp/keystore/key.pem
```

### Enroll Org2’s Admin

```bash
mkdir -p org2/peer1/msp/admincerts
mkdir -p org2/peer2/msp/admincerts

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2/peer1/assets/ca/org2-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://admin-org2:org2AdminPW@0.0.0.0:7055

# 修改私钥文件名称
mv /tmp/hyperledger/org2/admin/msp/keystore/447237fc7ac9c8f43af9035dc5969c7d1a29a7544bc4243293857d7bf744fe48_sk /tmp/hyperledger/org2/admin/msp/keystore/priv_sk

cp org2/admin/msp/signcerts/cert.pem org2/peer1/msp/admincerts/org2-admin-cert.pem

cp org2/admin/msp/signcerts/cert.pem org2/peer2/msp/admincerts/org2-admin-cert.pem
```

------

## Enroll Orderer

### Enroll Orderer1

#### Enroll Orderer1 ECert 证书

```bash
mkdir -p org0/orderer1/assets/ca/ && cp org0/ca/crypto/ca-cert.pem org0/orderer1/assets/ca/org0-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/orderer1
export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/orderer1/assets/ca/org0-ca-cert.pem

./fabric-ca-client enroll -d -u https://orderer0.example.com:ordererpw@0.0.0.0:7053


# 修改私钥文件名称
mv org0/orderer1/msp/keystore/308fb646f0ad42341a05c918b409617b620827560d2f2383ca24a6e3982cb197_sk org0/orderer1/msp/keystore/priv_sk
```

#### Enroll Orderer1 TLS 证书

```bash
mkdir -p org0/orderer1/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org0/orderer1/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/orderer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/orderer1/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://orderer0.example.com:ordererPW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts 'orderer0.example.com,orderer0,192.168.159.11'

# 将 keystore 路径下的文件改名为 key.pem 
mv org0/orderer1/tls-msp/keystore/c6943522622556fe52c32bbf5cfcaf083d9903b33a8e734107ca576b138bbcd5_sk org0/orderer1/tls-msp/keystore/key.pem
```

### Enroll Orderer2

#### Enroll Orderer2 ECert 证书

```bash
mkdir -p org0/orderer2/assets/ca/ && cp org0/ca/crypto/ca-cert.pem org0/orderer2/assets/ca/org0-ca-cert.pem

export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/orderer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/orderer2/assets/ca/org0-ca-cert.pem

./fabric-ca-client enroll -d -u https://orderer1.example.com:ordererpw@0.0.0.0:7053

# 修改私钥文件名称
mv org0/orderer2/msp/keystore/e76fc9e3e9c3c44ae25479fc354d2a4071c9da253ed5f01975299229bda02f3f_sk org0/orderer2/msp/keystore/priv_sk
```

#### Enroll Orderer2 TLS 证书

```bash
mkdir -p org0/orderer2/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org0/orderer2/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/orderer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/orderer2/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://orderer1.example.com:ordererPW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts 'orderer1.example.com,orderer1,192.168.159.11'

# 将 keystore 路径下的文件改名为 key.pem
mv org0/orderer2/tls-msp/keystore/2669d5381f0802e9b8dee1d4b5af329fe59dc64e4501ab777797c383f259fbcf_sk org0/orderer2/tls-msp/keystore/key.pem
```

### Enroll Orderer3

#### Enroll Orderer3 ECert 证书

```bash
mkdir -p org0/orderer3/assets/ca/ && cp org0/ca/crypto/ca-cert.pem org0/orderer3/assets/ca/org0-ca-cert.pem

export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/orderer3
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/orderer3/assets/ca/org0-ca-cert.pem

./fabric-ca-client enroll -d -u https://orderer2.example.com:ordererpw@0.0.0.0:7053

# 修改私钥文件名称
mv org0/orderer3/msp/keystore/17121acc947bc270fbb7f7832026e34e6458751eb8f0dd6b2d2c420b6c331402_sk org0/orderer3/msp/keystore/priv_sk
```

#### Enroll Orderer3 TLS 证书

```bash
mkdir -p org0/orderer3/assets/tls-ca/ && cp tls-ca/crypto/tls-ca-cert.pem org0/orderer3/assets/tls-ca/tls-ca-cert.pem

export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/orderer3
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/orderer3/assets/tls-ca/tls-ca-cert.pem

./fabric-ca-client enroll -d -u https://orderer2.example.com:ordererPW@0.0.0.0:7052 --enrollment.profile tls --csr.hosts 'orderer2.example.com,orderer2,192.168.159.11'

# 将 keystore 路径下的文件改名为 key.pem
mv org0/orderer3/tls-msp/keystore/1362d82282747de68a35d2a6026cd8e5f2276c60dd35e7e76bfd28f8667f8313_sk org0/orderer3/tls-msp/keystore/key.pem
```

------

### Enroll Org0’s Admin

```bash
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org0/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp

./fabric-ca-client enroll -d -u https://admin-org0:org0adminpw@0.0.0.0:7053

# 修改私钥文件名称
mv /tmp/hyperledger/org0/admin/msp/keystore/4ee4c8bc13c068e1aca976dc06a430fa0e54a329714dd62f5b4a9f0fd6f2eea7_sk /tmp/hyperledger/org0/admin/msp/keystore/priv_sk


mkdir /tmp/hyperledger/org0/orderer1/msp/admincerts && cp /tmp/hyperledger/org0/admin/msp/signcerts/cert.pem /tmp/hyperledger/org0/orderer1/msp/admincerts/orderer-admin-cert.pem


mkdir /tmp/hyperledger/org0/orderer2/msp/admincerts && cp /tmp/hyperledger/org0/admin/msp/signcerts/cert.pem /tmp/hyperledger/org0/orderer2/msp/admincerts/orderer-admin-cert.pem


mkdir /tmp/hyperledger/org0/orderer3/msp/admincerts && cp /tmp/hyperledger/org0/admin/msp/signcerts/cert.pem /tmp/hyperledger/org0/orderer3/msp/admincerts/orderer-admin-cert.pem
```

## 构建 Orderer 本地 MSP 结构

#### Orderer 1 Local MSP

```bash
mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp

mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls

# TLS 私钥
cp org0/orderer1/tls-msp/keystore/key.pem crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls/server.key

# TLS 签名证书
cp org0/orderer1/tls-msp/signcerts/cert.pem crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls/server.crt

# TLS 根证书
cp org0/orderer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/tls/ca.crt

cp -r org0/orderer1/msp/ crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/

mv crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/cacerts/0-0-0-0-7053.pem crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/cacerts/ca.example.com-cert.pem

mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts && cp org0/orderer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# 编写 config.yaml 文件
vim crypto-config/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
```

#### Orderer 2 Local MSP

```bash
mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp

mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls

# TLS 私钥
cp org0/orderer2/tls-msp/keystore/key.pem crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.key

# TLS 签名证书
cp org0/orderer2/tls-msp/signcerts/cert.pem crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/server.crt

# TLS 根证书
cp org0/orderer2/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt

# MSP
cp -r org0/orderer2/msp/ crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/

mv crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp/cacerts/0-0-0-0-7053.pem crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp/cacerts/ca.example.com-cert.pem

mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp/tlscacerts && cp org0/orderer2/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# 编写 config.yaml 文件
vim crypto-config/ordererOrganizations/example.com/orderers/orderer1.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
```

#### Orderer 3 Local MSP

```bash
mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp

mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls

# TLS 私钥
cp org0/orderer3/tls-msp/keystore/key.pem crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.key

# TLS 签名证书
cp org0/orderer3/tls-msp/signcerts/cert.pem crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/server.crt

# TLS 根证书
cp org0/orderer3/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/tls/ca.crt

# MSP
cp -r org0/orderer3/msp/ crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/

mv crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/cacerts/0-0-0-0-7053.pem crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/cacerts/ca.example.com-cert.pem

mkdir -p crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/tlscacerts && cp org0/orderer3/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# 编写 config.yaml 文件
vim crypto-config/ordererOrganizations/example.com/orderers/orderer2.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
```

#### crypto-config/ordererOrganizations/example.com/msp/

```bash
mkdir -p crypto-config/ordererOrganizations/example.com/msp/admincerts
mkdir -p crypto-config/ordererOrganizations/example.com/msp/cacerts
mkdir -p crypto-config/ordererOrganizations/example.com/msp/tlscacerts

cp org0/orderer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

cp org0/orderer1/msp/cacerts/0-0-0-0-7053.pem crypto-config/ordererOrganizations/example.com/msp/cacerts/ca.example.com-cert.pem

cp /tmp/hyperledger/org0/admin/msp/signcerts/cert.pem crypto-config/ordererOrganizations/example.com/msp/admincerts/orderer-admin-cert.pem

# 编写 config.yaml 文件
vim crypto-config/ordererOrganizations/example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
```

------

## 构建 Org1 Peer 本地 MSP 结构。

#### Org1 Peer1 Local MSP

```bash
mkdir -p crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/ && cp -r org1/peer1/msp/ crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com

mkdir -p crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls

cp org1/peer1/tls-msp/signcerts/cert.pem crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.crt

cp org1/peer1/tls-msp/keystore/key.pem crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.key

cp org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: orderer
```

#### Org1 Peer2 Local MSP

```bash
mkdir -p crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/ && cp -r org1/peer2/msp/ crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/

mkdir -p crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls

cp org1/peer2/tls-msp/signcerts/cert.pem crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/server.crt

cp org1/peer2/tls-msp/keystore/key.pem crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/server.key

cp org1/peer2/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: orderer
```

#### crypto-config/peerOrganizations/org1.example.com/msp

```bash
mkdir -p crypto-config/peerOrganizations/org1.example.com/msp/admincerts
mkdir -p crypto-config/peerOrganizations/org1.example.com/msp/cacerts
mkdir -p crypto-config/peerOrganizations/org1.example.com/msp/tlscacerts

cp org1/admin/msp/cacerts/0-0-0-0-7054.pem crypto-config/peerOrganizations/org1.example.com/msp/cacerts/ca.org1.example.com-cert.pem

cp org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org1.example.com/msp/tlscacerts/tlsca.org1.example.com-cert.pem

cp /tmp/hyperledger/org1/admin/msp/signcerts/cert.pem crypto-config/peerOrganizations/org1.example.com/msp/admincerts/org1-admin-cert.pem

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org1.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.org1.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.org1.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.org1.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.org1.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
```

### crypto-config/peerOrganizations/org1.example.com/users

```bash
mkdir -p crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com

cp -r org1/admin/msp/ crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com

mkdir -p crypto-config/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/msp/admincerts

cp /tmp/hyperledger/org1/admin/msp/signcerts/cert.pem crypto-config/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/msp/admincerts/org1-admin-cert.pem

mkdir -p crypto-config/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/msp/tlscacerts

cp org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/msp/tlscacerts/tlsca.org1.example.com-cert.pem


# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/0-0-0-0-7054.pem
    OrganizationalUnitIdentifier: orderer
```

## 构建 Org2 Peer 本地 MSP 结构

#### Org2 Peer1 Local MSP

```bash
mkdir -p crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/ && cp -r org2/peer1/msp/ crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com

mkdir -p crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls

cp org2/peer1/tls-msp/signcerts/cert.pem crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/server.crt

cp org2/peer1/tls-msp/keystore/key.pem crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/server.key

cp org2/peer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: orderer
```

#### Org2 Peer2 Local MSP

```bash
mkdir -p crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/ && cp -r org2/peer2/msp/ crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/

mkdir -p crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls

cp org2/peer2/tls-msp/signcerts/cert.pem crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/server.crt

cp org2/peer2/tls-msp/keystore/key.pem crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/server.key

cp org2/peer2/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: orderer
```

#### crypto-config/peerOrganizations/org2.example.com/msp

```bash
mkdir -p crypto-config/peerOrganizations/org2.example.com/msp/admincerts
mkdir -p crypto-config/peerOrganizations/org2.example.com/msp/cacerts
mkdir -p crypto-config/peerOrganizations/org2.example.com/msp/tlscacerts

cp org2/admin/msp/cacerts/0-0-0-0-7055.pem crypto-config/peerOrganizations/org2.example.com/msp/cacerts/ca.org2.example.com-cert.pem

cp org2/peer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org2.example.com/msp/tlscacerts/tlsca.org2.example.com-cert.pem

cp /tmp/hyperledger/org2/admin/msp/signcerts/cert.pem crypto-config/peerOrganizations/org2.example.com/msp/admincerts/org2-admin-cert.pem

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org2.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.org2.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.org2.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.org2.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.org2.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
```

### crypto-config/peerOrganizations/org2.example.com/users

```bash
mkdir -p crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com

cp -r org2/admin/msp/ crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com

mkdir -p crypto-config/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/msp/admincerts

cp /tmp/hyperledger/org2/admin/msp/signcerts/cert.pem crypto-config/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/msp/admincerts/org2-admin-cert.pem

mkdir -p crypto-config/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/msp/tlscacerts

cp org2/peer1/tls-msp/tlscacerts/tls-0-0-0-0-7052.pem crypto-config/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/msp/tlscacerts/tlsca.org2.example.com-cert.pem

# 编写 config.yaml 文件
vim crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp/config.yaml

NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/0-0-0-0-7055.pem
    OrganizationalUnitIdentifier: orderer
```

准备好 MSP 目录结构后就可以搭建 Fabric 网络了。
