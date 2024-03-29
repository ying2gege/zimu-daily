const bannerUrlPrefix = getApp().globalData.serverPrefix

Page({
  data: {
    // 轮播图
    swiperList: [
      {src: `${bannerUrlPrefix}/banner-christmas-1.jpg`},
      {src: `${bannerUrlPrefix}/banner-christmas-2.jpg`},
    ],
    // 菜单
    menus: [
      {
        code: 'accountBook',
        text: '账本',
        icon: 'balance-list-o',
        url: '/pages/account-book/account-book'
      },
      {
        code: 'reminder',
        text: '提醒',
        icon: 'list-switch',
        url: '/pages/reminder/reminder'
      },
      {
        code: 'schedule',
        text: '日程',
        icon: 'todo-list-o',
        url: '/pages/schedule/schedule'
      },
      {
        code: 'note',
        text: '便签',
        icon: 'notes-o',
        url: '/pages/note/note'
      }
    ]
  }
})
