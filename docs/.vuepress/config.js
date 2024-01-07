const sidebar = require('./config/sidebar')

module.exports = {
  title: "XzXie's docs",
  description: 'notes, blogs, share',
  head: [
    [
      'link', {rel: 'icon', href: '/favicon.ico'}
    ]
  ],
  plugins: [
    [
      '@vuepress/last-updated',
      {
        transformer: (timestamp) => {
          const moment = require('moment')
          moment.locale("zh-cn")
          return moment(timestamp).fromNow()
        }
      }
    ],
  ],
  themeConfig: {
    lastUpdated: '更新时间',
    logo: '/assets/img/logo.png',
    nav: [
      {text: '主页', link: '/'},
      {text: '关于', link: '/about/'},
      {
        text: '区块链', items: [
          {text: '比特币', link: '/blockchain/BTC/比特币与区块链'},
          {text: '以太坊', link: '/blockchain/ETH/部署以太坊私链'},
          {text: 'Fabric', link: '/blockchain/Fabric/1_部署 Fabric 生产网络'},
        ]
      },
      {
        text: '前端', items: [
          {text: 'Vue', link: '/front-end/Vue/Vue2'},
          {text: 'VuePress', link: '/front-end/VuePress/VuePress项目部署'},
        ]
      },
      {text: 'Github', link: 'https://github.com/xBeTe'},
    ],
    sidebar,


  },
}