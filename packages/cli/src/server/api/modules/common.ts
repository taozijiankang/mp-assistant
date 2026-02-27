import { FastifyInstance } from "fastify";
import { Api, FilesPrefix } from "mp-assistant-common/dist/api/index.js";
import { getErrorApiResponse, getSuccessApiResponse } from "mp-assistant-common/dist/api/utils.js";
import { pipeline } from "node:stream/promises";
import fs from "node:fs"
import path from "node:path";
import { getFilesDir } from "../../../pathManage.js";
import dayjs from "dayjs";
import { getUUID } from "mp-assistant-common/dist/utils/index.js";

export const registerCommonApi = (fastify: FastifyInstance) => {
    fastify.post(Api.Common.UploadFile.url, async function (req, reply): Promise<Api.Common.UploadFile.Response> {
        const data = await req.file();

        if (!data) {
            return getErrorApiResponse('Worker not found', 404);
        }

        const fileDir = path.join(getFilesDir(), dayjs().format('YYYY/MM/DD'));
        const fileName = `${getUUID()}.${data.filename.split('.')?.[1] || ''}`;

        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }

        await pipeline(data.file, fs.createWriteStream(path.join(fileDir, fileName)));

        return getSuccessApiResponse(FilesPrefix + '/' + path.relative(getFilesDir(), path.join(fileDir, fileName)).replaceAll(path.sep, '/'));
    });

    fastify.post(Api.Common.ConvertFilePath.url, async function (req, reply): Promise<Api.Common.ConvertFilePath.Response> {
        const { filePaths = [] } = req.body as Api.Common.ConvertFilePath.RequestBody;

        const convertedFilePaths = filePaths.map(filePath => {
            return path.join(getFilesDir(), filePath.replace(new RegExp(`^${FilesPrefix}/`), '')).replaceAll(path.sep, '/');
        });

        return getSuccessApiResponse(convertedFilePaths);
    });
};