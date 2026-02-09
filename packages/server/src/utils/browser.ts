import { Page } from "playwright";

/**
 * 禁用页面所有鼠标交互
 * @param page - 页面
 */
export function setPagePointerEventsNone(page: Page) {
    page.addStyleTag({
        content: `
            html {
                pointer-events: none !important; /* 禁用所有鼠标交互 */
                user-select: none !important;   /* 禁用文字选中 */
                cursor: not-allowed !important; /* 改变指针形状提示不可用 */
            }
        `
    });
}