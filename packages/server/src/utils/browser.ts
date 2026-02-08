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

/**
 * 给页面加一层蒙版，防止用户点击页面
 * @param page - 页面
 */
export async function setPageOverlay(page: Page) {
    // 1. 注入遮罩层，禁止用户操作
    await page.addStyleTag({
        content: `
      #pw-protection-mask {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: 99999999;
        background: rgba(0,0,0,0.1); /* 或者 transparent */
        cursor: not-allowed;
      }
    `
    });

    await page.evaluate(() => {
        const mask = document.createElement('div');
        mask.id = 'pw-protection-mask';
        document.body.appendChild(mask);
    });
}