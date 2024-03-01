import {
  H5_WORK_NOT_EXISTS,
  IMAGE_UPALOD_FILE_SIZE_ERROR,
  IMAGE_UPLOAD_FAIL,
  IMAGE_UPLOAD_FILE_FORMAT_ERROR
} from '@/const/utils'

export const utilsErrorMessages = {
  [IMAGE_UPLOAD_FAIL]: {
    errno: 103001,
    message: '上传文件失败'
  },
  [IMAGE_UPLOAD_FILE_FORMAT_ERROR]: {
    errno: 103002,
    message: '不能上传这种文件格式，请上传图片格式'
  },
  [IMAGE_UPALOD_FILE_SIZE_ERROR]: {
    errno: 103003,
    message: '上传文件超过最大限制'
  },
  [H5_WORK_NOT_EXISTS]: {
    errno: 103004,
    message: '作品不存在'
  }
}
