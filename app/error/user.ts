import {
  USER_VALIDATE_FAIL,
  USER_ALREADY_EXISTS,
  LOGIN_CHECK_FAIL_INFO,
  LOGIN_VALIDATE_FAIL,
  SEND_VERI_CODE_FREQUENTLY_FAIL_INFO,
  LOGIN_VERI_CODE_INCORRECT_FAIL_INFO,
  SEND_VERI_CODE_ERROR,
  GITEE_OAUTH_ERROR
} from '@/const/user'

export const userErrorMessages = {
  // 输入信息验证失败
  [USER_VALIDATE_FAIL]: {
    errno: 101001,
    message: '输入信息验证失败'
  },
  // 创建用户，写入数据库失败
  [USER_ALREADY_EXISTS]: {
    errno: 101002,
    message: '该邮箱已经被注册，请直接登录'
  },
  // 用户不存在或者密码错误
  [LOGIN_CHECK_FAIL_INFO]: {
    errno: 101003,
    message: '该用户不存在或者密码错误'
  },
  // 登录验证失败
  [LOGIN_VALIDATE_FAIL]: {
    errno: 101004,
    message: '登录校验失败'
  },
  // 发送短信验证码过于频繁
  [SEND_VERI_CODE_FREQUENTLY_FAIL_INFO]: {
    errno: 101005,
    message: '请勿频繁获取短信验证码'
  },
  // 使用手机登录时，验证码不正确
  [LOGIN_VERI_CODE_INCORRECT_FAIL_INFO]: {
    errno: 101006,
    message: '验证码不正确'
  },
  // 验证码发送失败
  [SEND_VERI_CODE_ERROR]: {
    errno: 101007,
    message: '验证码发送失败'
  },
  // gitee 授权出错
  [GITEE_OAUTH_ERROR]: {
    errno: 101008,
    message: 'gitee 授权出错'
  }
}
