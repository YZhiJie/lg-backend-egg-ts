import { WORK_NO_PERMISSION_FAIL, WORK_VALIDATE_FAIL } from '@/const/work'

export const workErrorMessages = {
  [WORK_VALIDATE_FAIL]: {
    errno: 102001,
    message: '输入信息验证失败'
  },
  [WORK_NO_PERMISSION_FAIL]: {
    errno: 102002,
    message: '没有权限完成操作'
  },
  workNoPublicFail: {
    errno: 102003,
    message: '该作品未公开，不能进行操作'
  },
  channelValidateFail: {
    errno: 102004,
    message: '频道输入信息验证失败'
  },
  channelOperateFail: {
    errno: 102005,
    message: '频道操作失败'
  },
  workNoFound: {
    errno: 102006,
    message: '作品没找到'
  }
}
