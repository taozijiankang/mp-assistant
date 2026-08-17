export interface ReviewTemplate {
    /** 模板名称 */
    name: string;
    /** 版本描述 */
    versionDescription: string;
    /** 图片预览（服务端文件路径列表） */
    imagePreviews: string[];
    /** 视频预览（服务端文件路径） */
    videoPreview?: string;
}
