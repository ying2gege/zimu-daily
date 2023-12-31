/**
 * 账本收支明细 model
 */
import { DataTypes } from 'sequelize'
import sequelize from '../db'
import { AccountBookItemInstance } from 'business/account-book'
import dayjs from 'dayjs'

const AccountBookItem = sequelize.define<AccountBookItemInstance>(
  'AccountBookItem',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    // 父id，即账本id
    parentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // 账本类型
    amount: DataTypes.STRING,
    // 交易类型
    type: DataTypes.STRING,
    // 用途
    source: DataTypes.STRING,
    // 备注
    comment: DataTypes.STRING,
    // 交易时间
    transactionTime: {
      type: DataTypes.DATE,
      allowNull: false,
      get() {
        const value = this.getDataValue('transactionTime')
        return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : null
      },
    },
    // 共享的账本id
    relatedIds: DataTypes.VIRTUAL,
    // 创建时间
    createdAt: DataTypes.DATE,
    // 创建人
    createdBy: DataTypes.STRING,
    // 更新时间
    updatedAt: DataTypes.DATE,
    // 更新人
    updatedBy: DataTypes.STRING,
    // 删除时间，软删
    deletedAt: DataTypes.DATE,
  },
  {
    tableName: 'account_book_item',
  }
)

export default AccountBookItem
