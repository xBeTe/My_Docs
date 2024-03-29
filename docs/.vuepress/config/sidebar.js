//侧边栏
module.exports = [
    '/about',
    {
      title: '区块链',
      collapsable: true,
      path: '/blockchain/',
      children:
        [
          {
            title: '比特币',
            collapsable: true,
            children: [
              '/blockchain/BTC/比特币与区块链',
            ]
          },
          {
            title: '以太坊',
            collapsable: true,
            children: [
              '/blockchain/ETH/部署以太坊私链',
            ]
          },
          {
            title: 'Fabric',
            collapsable: true,
            children: [
              '/blockchain/Fabric/1_部署 Fabric 生产网络',
              '/blockchain/Fabric/2_部署 orderer 节点',
              '/blockchain/Fabric/3_部署 peer 节点',
              '/blockchain/Fabric/4_Docker 方式多机部署生产网络',
              '/blockchain/Fabric/5_链码的安装与调用',
              '/blockchain/Fabric/6_部署 Hyperledger Explorer 超级账本浏览器',
              '/blockchain/Fabric/7_discover 工具的使用',
              '/blockchain/Fabric/8_Fabric Gateway 的使用',
              '/blockchain/Fabric/Fabric 数字版权应用',
            ]


          }
        ]
    },
    {
      title: '前端',
      path: '/front-end/',
      collapsable: true,
      children:
        [
          {
            title: 'Vue',
            collapsable: true,
            children: [
              '/front-end/Vue/Vue2',
              '/front-end/Vue/Vue3快速上手',
            ]
          },
          {
            title: 'VuePress',
            collapsable: true,
            children: [
              '/front-end/VuePress/VuePress项目部署',
            ]
          }

        ]
    }
]