import {REMINDER_CATEGORY_DESC, REMINDER_PRIORITY_MARK, REMINDER_PRIORITY_MARK_COLOR} from '../../constants/reminder'
import {Y_N} from '../../constants/data'
import { deleteById, queryByPage, updateById, batchDelete, batchMove } from '../reminder-item/api'
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
import { Reminder } from '../reminder/types'
import { navigateTo } from '../../utils/rotuer'
import { ReminderItem } from '../reminder-item/types'
import { queryById as queryReminderById, queryList as queryReminderList } from '../reminder/api'

const OPERATION_KEYS = {
  SELECTABLE: 'selectable'
}

const OPERATIONS = {
  [OPERATION_KEYS.SELECTABLE]: '选择提醒事项'
}

Page({
  options: {
    pureDataPattern: /^_/
  },

  /**
   * 页面的初始数据
   */
  data: {
    reminderHeader: {} as Reminder,
    reminderItems: [] as ReminderItem[],
    // 从分类统计跳转，
    fromCategory: '',
    // 下拉刷新触发
    refresherTriggered: false,
    REMINDER_PRIORITY_MARK,
    REMINDER_PRIORITY_MARK_COLOR,
    // 是否可选择状态
    selectable: false,
    // 选择状态下勾选的代办事项
    selectedItems: [] as string[],
    // 展示操作列表
    showOperationActions: false,
    // 操作列表
    operationActions: Object.entries(OPERATIONS).map(([value, name]: [string, string]) => ({
      name,
      value
    })),
    /** 移动提醒事项 start */
    // 是否展示可移动的事项列表
    showListSelector: false,
    // 可移动的事项列表
    reminderList: [] as Reminder[],
    // 事项列表加载标识
    listSelectorLoading: false,
    // 列表选择弹出层字段映射
    listSelectorFieldMap: {
      title: 'name'
    },
    /** 移动提醒事项 end */
    // 列表初始化查询参数
    _initFilter: {
      byCategory: false,
      filter: ''
    },
    _page: 1, // 当前页
    _pageSize: 50 // 每页数据量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(query: {
    id?: string
    category?: string
  }) {
    const isFromCategory = !!query.category

    this.setData({
      _initFilter: {
        byCategory: isFromCategory,
        filter: isFromCategory ? query.category! : query.id!
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.init()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 查询提醒事项信息
  async init() {
    // 查询提醒事项头数据
    this.queryReminderHeader()
    // 查询提醒事项明细列表
    this.queryReminderItems()
  },

  async queryReminderHeader() {
    const { byCategory, filter} = this.data._initFilter

    let reminderHeader: Reminder = {}

    if (byCategory) {
      reminderHeader = {
        id: filter,
        name: REMINDER_CATEGORY_DESC[filter]
      }
    } else {
      reminderHeader = await queryReminderById(filter)
    }

    this.setData({
      reminderHeader,
    })
  },

  async queryReminderItems(page?: number, pageSize?: number) {
    const { _page, _pageSize,  _initFilter: {byCategory, filter} } = this.data
    page = page || _page
    pageSize = pageSize || _pageSize

    const params = byCategory ? 
      {
        category: filter
      } :
      {
        parentId: filter
      }
    const data = await queryByPage(page, pageSize, params)

    // 若是第一页，则直接赋值，否则拼接到原列表
    const reminderItems = page === 1 ? data : this.data.reminderItems.concat(data)
    // 仅 page === 1(重置页数) 或当前页数据量不为空时，更新当前页
    const needUpdPage = page === 1 || data.length > 0

    this.setData({
      _page: needUpdPage ? page : _page,
      reminderItems
    })
  },

  // 新增事项
  handleAddTap() {
    navigateTo({
      url: `/pages/reminder-item/reminder-item?parentId=${this.data.reminderHeader.id}`
    })
  },

  // 下拉刷新
  handleRefresherRefresh() {
    const {_page, _pageSize} = this.data
    this.queryReminderItems(_page, _pageSize)
      .finally(() => {
        this.setData({
          refresherTriggered: false
        })
      })
  },

  // 触底
  handleScrollToLower() {
    this.queryReminderItems(this.data._page + 1)
  },

  // 点击行项目
  handleItemClick(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget.dataset.id

    /**
     * 两种情况：
     * 1. selectable 模式下，触发勾选
     * 2. 非 selectable 模式，跳转详情
     */
    if (this.data.selectable) {
      this.handleSelectChange(id)
    } else {
      navigateTo({
        url: `/pages/reminder-item/reminder-item?id=${id}`
      })
    }
  },

  // selectable 模式下，触发勾选
  handleSelectChange(e: WechatMiniprogram.CustomEvent | string) {
    const id = typeof e === 'string' ? e : (e as WechatMiniprogram.CustomEvent).currentTarget.dataset.id
    const selectedItems = this.data.selectedItems
    const index = selectedItems.indexOf(id)

    if (index > -1) {
      selectedItems.splice(index, 1)
    } else {
      selectedItems.push(id)
    }

    this.setData({
      selectedItems: selectedItems
    })
  },

  // 完成
  handleFinishedChange(e: WechatMiniprogram.CustomEvent) {
    const reminderItemId = e.currentTarget.dataset.id
    const value = e.detail

    console.log('value', value)

    const index = this.data.reminderItems.findIndex(rdi => rdi.id === reminderItemId)
    this.setData({
      [`reminderItems[${index}].finished`]: value ? Y_N.Y : Y_N.N
    })
    updateById(this.data.reminderItems[index])
      .then((data) => {
        this.setData({
          [`reminderItems[${index}`]: data
        })
      })
      .catch(() => {
        Notify({type: 'danger', message: '出错啦...'})
      })
  },

  // 删除
  handleDelete(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget.dataset.id
    deleteById(id)
      .then(() => {
        Notify({ type: 'success', message: '删除成功' })
        const {_page, _pageSize} = this.data
        this.queryReminderItems(_page, _pageSize)
      })
      .catch(e => {
        Notify(`删除失败:${e.message}`)
      })
  },

  // 展示操作列表
  handleOperationTap() {
    this.setData({
      showOperationActions: true
    })
  },

  // 关闭展示列表
  handleOperationActionClose() {
    this.setData({
      showOperationActions: false
    })
  },

  // 关闭选择模式
  handleCancelSelectableTap() {
    this.setData({
      selectedItems: [],
      selectable: false
    })
  },

  // 选中操作
  handleOperationActionSelect(e: WechatMiniprogram.CustomEvent) {
    const operation = e.detail.value
    switch(operation) {
      // 选择提醒事项
      case OPERATION_KEYS.SELECTABLE:
        this.setData({
          selectable: true
        })
        break
      default:
        break
    }
  },

  // 可选择状态下勾选行
  handleSelecteChange(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget.dataset.id
    const selectedItems = this.data.selectedItems
    
    const index = selectedItems.indexOf(id)
    if (index > -1) {
      selectedItems.splice(index, 1)
    } else {
      selectedItems.push(id)
    }

    this.setData({
      selectedItems: selectedItems
    })
  },

  // 批量删除处理函数
  batchDelHandler() {
    batchDelete(this.data.selectedItems)
    .then(() => {
      Notify({ type: 'success', message: '删除成功' })
      this.init()
      this.handleCancelSelectableTap()
    })
    .catch((e: any) => {
      Notify(`删除失败：${e.message}`)
    })
  },

  // 批量删除
  handleBatchDelTap() {
    const selectedItems = this.data.selectedItems
    if (selectedItems.length === 0) return

    Dialog.confirm({
      title: '警告',
      message: '确认删除已选择的提醒事项？',
    })
      .then(async () => {
        this.batchDelHandler()
      })
  },

  /** 移动提醒事项到指定列表 start */
  // 开启移动事项列表弹出层
  handleBatchMoveTap() {
    this.setData({
      showListSelector: true,
      listSelectorLoading: true
    })
    queryReminderList()
      .then((data) => {
        this.setData({
          reminderList: data.filter((r: Reminder) => r.id !== this.data.reminderHeader.id)
        })
      })
      .finally(() => {
        this.setData({
          listSelectorLoading: false
        })
      })
  },

  // 关闭事项列表选择弹出层
  handleListSelectorClose() {
    this.setData({
      showListSelector: false
    })
  },

  // 确认移动到的事项列表
  handleListSelectorConfirm(e: WechatMiniprogram.CustomEvent) {
    const selected = e.detail as unknown as string
    // todo:批量保存代办事项
    batchMove(this.data.selectedItems, selected)
      .then(() => {
        Notify({ type: 'success', message: '移动成功' })
        this.init()
        this.handleCancelSelectableTap()
      })
      .catch((e: any) => {
        Notify(`移动失败：${e.message}`)
      })
      .finally(this.handleListSelectorClose)
  }
  /** 移动提醒事项到指定列表 end */
})