import path from "path";
import dayjs from "dayjs";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { getFilesDir } from "@mp-assistant/common/dist/pathManage.js";
import fs from "fs";

export async function saveScreenshotBufferToFile(buffer: Buffer) {
    const fileDir = path.join(getFilesDir(), dayjs().format('YYYY/MM/DD'));
    const fileName = `${getUUID()}.png`;
    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }

    const filePath = path.join(fileDir, fileName);

    await fs.promises.writeFile(filePath, buffer);

    return filePath;
}