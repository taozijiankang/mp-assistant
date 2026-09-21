import { WXVersionBasicInfo } from "../../types/wx.js";

export enum VersionPositioningType {
    /** 描述 */
    Describe = 'describe',
    /** 开发者 */
    NickName = 'nick_name',
    /** 版本 */
    Version = 'version',
}

export const VersionPositioningTypeDict = {
    [VersionPositioningType.Describe]: '备注',
    [VersionPositioningType.NickName]: '发布者',
    [VersionPositioningType.Version]: '版本号',
}

export const VersionPositioningTypeOptions = Object.values(VersionPositioningType).map(type => ({
    label: VersionPositioningTypeDict[type],
    value: type,
}));

export enum VersionPositioningCriteria {
    /** 相等 */
    Equal = 'Equal',
    /** 包含 */
    Inclusion = 'Inclusion',
}

export const VersionPositioningCriteriaDict = {
    [VersionPositioningCriteria.Equal]: '等于',
    [VersionPositioningCriteria.Inclusion]: '包含'
}

export const VersionPositioningCriteriaOptions = Object.values(VersionPositioningCriteria).map(type => ({
    label: VersionPositioningCriteriaDict[type],
    value: type,
}));

export interface VersionPositioner {
    type: VersionPositioningType;
    criteria: VersionPositioningCriteria;
    value: string;
}

/**
 * 判断版本是否满足一组筛选条件。
 * - positioners 之间是「且」关系，须全部满足才返回 true
 * - 空条件数组返回 false（无筛选 = 不匹配任何版本）
 * - 值比较前会 trim；criteria 为 Inclusion 且值为空时视为不匹配
 */
export function versionSatisfy(version: WXVersionBasicInfo, positioners: VersionPositioner[]) {
    if (!positioners.length) return false;
    return positioners.every(item => {
        const value = item.value.trim();
        switch (item.type) {
            case VersionPositioningType.Describe:
                return {
                    [VersionPositioningCriteria.Equal]: version.describe === value,
                    [VersionPositioningCriteria.Inclusion]: value ? version.describe?.includes(value) : false,
                }[item.criteria]
            case VersionPositioningType.NickName:
                return {
                    [VersionPositioningCriteria.Equal]: version.nick_name === value,
                    [VersionPositioningCriteria.Inclusion]: value ? version.nick_name?.includes(value) : false,
                }[item.criteria]
            case VersionPositioningType.Version:
                return {
                    [VersionPositioningCriteria.Equal]: version.version === value,
                    [VersionPositioningCriteria.Inclusion]: value ? version.version?.includes(value) : false,
                }[item.criteria]
            default:
                return false;
        }
    });
}