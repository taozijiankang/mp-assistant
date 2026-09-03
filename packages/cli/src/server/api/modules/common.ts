import { FastifyInstance } from "fastify";
import { Api } from "@mp-assistant/common/dist/api/index.js";
import { getErrorApiResponse, getSuccessApiResponse } from "@mp-assistant/common/dist/api/utils.js";
import { pipeline } from "node:stream/promises";
import fs from "node:fs"
import path from "node:path";
import dayjs from "dayjs";
import { getUUID } from "@mp-assistant/common/dist/utils/index.js";
import { pathNormalize } from "@mp-assistant/common/dist/utils/node.js";
import { getFilesDir } from "../../../pathManage.js";

export const registerCommonApi = (fastify: FastifyInstance) => {
    fastify.post(Api.Common.UploadFile.url, async function (req, reply): Promise<Api.Common.UploadFile.Response> {
        const data = await req.file();

        if (!data) {
            return getErrorApiResponse('未上传文件', 404);
        }

        const fileDir = path.join(getFilesDir(), dayjs().format('YYYY/MM/DD'));
        const fileName = `${getUUID()}${path.extname(data.filename)}`;

        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }

        await pipeline(data.file, fs.createWriteStream(path.join(fileDir, fileName)));

        return getSuccessApiResponse(pathNormalize(path.join(fileDir, fileName)));
    });

    fastify.get(Api.Common.GetFile.url, async function (req, reply) {
        const { filePath } = req.query as Api.Common.GetFile.RequestQuery;

        const resolvedPath = path.resolve(decodeURIComponent(filePath));
        const filesDir = path.resolve(getFilesDir());

        // 防止路径穿越，只允许访问 files 目录内的文件
        if (!resolvedPath.startsWith(filesDir + path.sep)) {
            return getErrorApiResponse('非法文件路径', 403);
        }

        const fileDir = path.dirname(resolvedPath);
        const fileName = path.basename(resolvedPath);

        return reply.sendFile(fileName, fileDir);
    });
};